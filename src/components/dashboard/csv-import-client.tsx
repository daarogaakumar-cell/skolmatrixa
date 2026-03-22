"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  X,
  ArrowRight,
} from "lucide-react";
import { bulkCreateStudents } from "@/actions/students";

interface ClassOption {
  id: string;
  name: string;
  section: string | null;
}

interface BatchOption {
  id: string;
  name: string;
}

interface CSVImportClientProps {
  tenantType: string;
  classes: ClassOption[];
  batches: BatchOption[];
}

type ImportStep = "upload" | "map" | "preview" | "result";

interface ParsedRow {
  [key: string]: string;
}

interface MappedStudent {
  admissionNo: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  classId?: string;
  batchId?: string;
  rollNo?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  _errors: string[];
}

const REQUIRED_FIELDS = ["admissionNo", "name"];

const FIELD_OPTIONS = [
  { value: "", label: "— Skip —" },
  { value: "admissionNo", label: "Admission No *" },
  { value: "name", label: "Name *" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "dateOfBirth", label: "Date of Birth" },
  { value: "gender", label: "Gender" },
  { value: "rollNo", label: "Roll No" },
  { value: "guardianName", label: "Guardian Name" },
  { value: "guardianPhone", label: "Guardian Phone" },
  { value: "guardianEmail", label: "Guardian Email" },
  { value: "guardianRelation", label: "Guardian Relation" },
];

// Auto-detect column mapping based on header names
function autoDetectColumn(header: string): string {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  const map: Record<string, string> = {
    admissionno: "admissionNo",
    admissionnumber: "admissionNo",
    admno: "admissionNo",
    name: "name",
    fullname: "name",
    studentname: "name",
    email: "email",
    emailaddress: "email",
    phone: "phone",
    phonenumber: "phone",
    mobile: "phone",
    dob: "dateOfBirth",
    dateofbirth: "dateOfBirth",
    birthdate: "dateOfBirth",
    gender: "gender",
    sex: "gender",
    rollno: "rollNo",
    rollnumber: "rollNo",
    roll: "rollNo",
    guardianname: "guardianName",
    parentname: "guardianName",
    fathername: "guardianName",
    guardianphone: "guardianPhone",
    parentphone: "guardianPhone",
    guardianmobile: "guardianPhone",
    guardianemail: "guardianEmail",
    parentemail: "guardianEmail",
    guardianrelation: "guardianRelation",
    relation: "guardianRelation",
  };
  return map[h] || "";
}

export function CSVImportClient({ tenantType, classes, batches }: CSVImportClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSchool = tenantType === "SCHOOL";

  const [step, setStep] = useState<ImportStep>("upload");
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [classId, setClassId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [mappedStudents, setMappedStudents] = useState<MappedStudent[]>([]);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported?: number;
    error?: string;
  } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (!results.data || results.data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        const rows = results.data as ParsedRow[];
        const hdrs = results.meta.fields || [];
        setRawData(rows);
        setHeaders(hdrs);

        // Auto-detect column mappings
        const autoMap: Record<string, string> = {};
        hdrs.forEach((h) => {
          const detected = autoDetectColumn(h);
          if (detected) autoMap[h] = detected;
        });
        setColumnMap(autoMap);

        setStep("map");
        toast.success(`${rows.length} rows found`);
      },
      error() {
        toast.error("Failed to parse CSV file");
      },
    });
  }

  function handleColumnMapChange(csvHeader: string, field: string) {
    setColumnMap((prev) => {
      const updated = { ...prev };
      if (field) {
        // Remove old mapping for this field
        Object.keys(updated).forEach((k) => {
          if (updated[k] === field) delete updated[k];
        });
        updated[csvHeader] = field;
      } else {
        delete updated[csvHeader];
      }
      return updated;
    });
  }

  function processMapping() {
    // Validate required fields are mapped
    const mappedFields = new Set(Object.values(columnMap));
    const missing = REQUIRED_FIELDS.filter((f) => !mappedFields.has(f));
    if (missing.length > 0) {
      toast.error(`Please map required fields: ${missing.join(", ")}`);
      return;
    }

    // Build reverse map: field -> csv header
    const reverseMap: Record<string, string> = {};
    Object.entries(columnMap).forEach(([csvHeader, field]) => {
      reverseMap[field] = csvHeader;
    });

    const students: MappedStudent[] = rawData.map((row, idx) => {
      const errors: string[] = [];

      const admissionNo = (reverseMap.admissionNo ? row[reverseMap.admissionNo] : "")?.trim() || "";
      const name = (reverseMap.name ? row[reverseMap.name] : "")?.trim() || "";

      if (!admissionNo) errors.push("Admission No is required");
      if (!name) errors.push("Name is required");

      let gender: "MALE" | "FEMALE" | "OTHER" | undefined;
      if (reverseMap.gender) {
        const g = (row[reverseMap.gender] || "").trim().toUpperCase();
        if (g === "M" || g === "MALE") gender = "MALE";
        else if (g === "F" || g === "FEMALE") gender = "FEMALE";
        else if (g) gender = "OTHER";
      }

      return {
        admissionNo,
        name,
        email: reverseMap.email ? row[reverseMap.email]?.trim() || undefined : undefined,
        phone: reverseMap.phone ? row[reverseMap.phone]?.trim() || undefined : undefined,
        dateOfBirth: reverseMap.dateOfBirth
          ? row[reverseMap.dateOfBirth]?.trim() || undefined
          : undefined,
        gender,
        classId: isSchool ? classId || undefined : undefined,
        batchId: !isSchool ? batchId || undefined : undefined,
        rollNo: reverseMap.rollNo ? row[reverseMap.rollNo]?.trim() || undefined : undefined,
        guardianName: reverseMap.guardianName
          ? row[reverseMap.guardianName]?.trim() || undefined
          : undefined,
        guardianPhone: reverseMap.guardianPhone
          ? row[reverseMap.guardianPhone]?.trim() || undefined
          : undefined,
        guardianEmail: reverseMap.guardianEmail
          ? row[reverseMap.guardianEmail]?.trim() || undefined
          : undefined,
        guardianRelation: reverseMap.guardianRelation
          ? row[reverseMap.guardianRelation]?.trim() || undefined
          : undefined,
        _errors: errors,
      };
    });

    setMappedStudents(students);
    setStep("preview");
  }

  function handleImport() {
    const validStudents = mappedStudents.filter((s) => s._errors.length === 0);
    if (validStudents.length === 0) {
      toast.error("No valid students to import");
      return;
    }

    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const payload = validStudents.map(({ _errors, ...rest }) => rest);
      const result = await bulkCreateStudents(payload);
      if (result.success) {
        setImportResult({
          success: true,
          imported: (result as any).data?.imported || validStudents.length,
        });
        setStep("result");
      } else {
        setImportResult({ success: false, error: result.error });
        setStep("result");
      }
    });
  }

  function handleDownloadTemplate() {
    const headers = [
      "Admission No",
      "Name",
      "Email",
      "Phone",
      "Date of Birth",
      "Gender",
      "Roll No",
      "Guardian Name",
      "Guardian Phone",
      "Guardian Email",
      "Guardian Relation",
    ];
    const sample = [
      "ADM-001",
      "Priya Sharma",
      "priya@example.com",
      "9876543210",
      "2010-05-15",
      "Female",
      "01",
      "Rajesh Sharma",
      "9876543211",
      "rajesh@example.com",
      "Father",
    ];
    const csv = [headers.join(","), sample.map((v) => `"${v}"`).join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setStep("upload");
    setRawData([]);
    setHeaders([]);
    setColumnMap({});
    setClassId("");
    setBatchId("");
    setMappedStudents([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const validCount = mappedStudents.filter((s) => s._errors.length === 0).length;
  const errorCount = mappedStudents.filter((s) => s._errors.length > 0).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/dashboard/students" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Import Students</h1>
          <p className="text-sm text-muted-foreground">
            Bulk import students from a CSV file
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "map", "preview", "result"] as ImportStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-border" />}
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : ["upload", "map", "preview", "result"].indexOf(step) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden sm:inline ${step === s ? "font-medium" : "text-muted-foreground"}`}
            >
              {s === "upload" ? "Upload" : s === "map" ? "Map Columns" : s === "preview" ? "Preview" : "Done"}
            </span>
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Upload a CSV file with student information. First row should be headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">
                Click to select a CSV file
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports .csv files up to 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Map Columns */}
      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to the system fields. Required fields are marked with *.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Class/Batch selector */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium mb-2">
                Assign all students to a {isSchool ? "class" : "batch"}:
              </p>
              {isSchool ? (
                <Select value={classId} onValueChange={(v) => setClassId(v || "")}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.section ? ` - ${c.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={batchId} onValueChange={(v) => setBatchId(v || "")}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select batch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Column mapping */}
            <div className="space-y-3">
              {headers.map((header) => (
                <div
                  key={header}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="sm:w-48">
                    <p className="text-sm font-medium truncate" title={header}>
                      {header}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      e.g., {rawData[0]?.[header] || "—"}
                    </p>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
                  <Select
                    value={columnMap[header] || ""}
                    onValueChange={(v) => handleColumnMapChange(header, v || "")}
                  >
                    <SelectTrigger className="w-full sm:w-52">
                      <SelectValue placeholder="— Skip —" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || "skip"} value={opt.value || "SKIP"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={reset}>
                Back
              </Button>
              <Button onClick={processMapping}>
                Continue
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview Import</CardTitle>
              <CardDescription>
                Review the data before importing. {validCount} valid, {errorCount} with errors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {validCount} valid
                </Badge>
                {errorCount > 0 && (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {errorCount} errors (will be skipped)
                  </Badge>
                )}
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Gender</TableHead>
                      <TableHead className="hidden lg:table-cell">Guardian</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedStudents.slice(0, 50).map((s, idx) => (
                      <TableRow
                        key={idx}
                        className={s._errors.length > 0 ? "bg-red-50 dark:bg-red-900/10" : ""}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {s.admissionNo || "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{s.name || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {s.email || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {s.gender || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {s.guardianName || "—"}
                        </TableCell>
                        <TableCell>
                          {s._errors.length === 0 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span
                              className="text-xs text-red-600"
                              title={s._errors.join(", ")}
                            >
                              <AlertCircle className="inline h-3.5 w-3.5 mr-1" />
                              {s._errors[0]}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {mappedStudents.length > 50 && (
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Showing first 50 of {mappedStudents.length} rows
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("map")}>
              Back
            </Button>
            <Button onClick={handleImport} disabled={isPending || validCount === 0}>
              {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Import {validCount} Student{validCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && importResult && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            {importResult.success ? (
              <>
                <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Import Successful!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {importResult.imported} student{importResult.imported !== 1 ? "s" : ""} imported
                  successfully.
                </p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Import Failed</h3>
                <p className="mt-2 text-sm text-red-600">{importResult.error}</p>
              </>
            )}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={reset}>
                Import More
              </Button>
              <Button nativeButton={false} render={<Link href="/dashboard/students" />}>
                View Students
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
