import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Helper: escape XML special characters ────────────────────────────────────
function xmlEscape(str: any): string {
  if (typeof str !== 'string') {
    if (str === null || str === undefined) return '';
    str = String(str);
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Safe template field replacement with validation ──────────────────────────
function safeReplaceTemplateFields(xml: string, values: Record<string, string>): string {
  let result = xml;
  
  for (const [key, value] of Object.entries(values)) {
    // Validate key format - only alphanumeric and underscore allowed
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      console.warn(`Skipping invalid field name: ${key}`);
      continue;
    }
    
    const safeValue = xmlEscape(value);
    const encodedPattern = new RegExp(`&lt;\\s*${escapeRegex(key)}\\s*&gt;`, "gi");
    result = result.replace(encodedPattern, safeValue);
    
    const literalPattern = new RegExp(`<\\s*${escapeRegex(key)}\\s*>`, "gi");
    result = result.replace(literalPattern, safeValue);
  }
  
  return result;
}

interface LogoAsset {
  bytes: Uint8Array;
  extension: "png" | "jpg";
  contentType: "image/png" | "image/jpeg";
}

function resolveImageType(contentType: string, url: string): LogoAsset["extension"] | null {
  const ct = contentType.toLowerCase();
  const normalizedUrl = url.toLowerCase();

  if (ct.includes("image/png") || normalizedUrl.endsWith(".png")) return "png";
  if (ct.includes("image/jpeg") || ct.includes("image/jpg") || normalizedUrl.endsWith(".jpg") || normalizedUrl.endsWith(".jpeg")) return "jpg";

  return null;
}

async function fetchLogoAsset(logoUrl: string, baseUrl?: string): Promise<LogoAsset | null> {
  if (!logoUrl) return null;

  const trimmedUrl = logoUrl.trim();
  const isHttp = /^https?:\/\//i.test(trimmedUrl);
  const isDataUri = /^data:image\//i.test(trimmedUrl);

  let resolvedUrl = trimmedUrl;
  if (!isHttp && !isDataUri) {
    if (!baseUrl) return null;
    try {
      resolvedUrl = new URL(trimmedUrl, baseUrl).toString();
    } catch {
      return null;
    }
  }

  try {
    const response = await fetch(resolvedUrl);
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    const extension = resolveImageType(contentType, resolvedUrl);
    if (!extension) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    return {
      bytes,
      extension,
      contentType: extension === "png" ? "image/png" : "image/jpeg",
    };
  } catch {
    return null;
  }
}

// ── Build a valid .docx from template_content JSON ───────────────────────────
async function buildDocxFromContent(
  templateContent: {
    header: { institution_name: string; certificate_title: string; logo_url: string };
    body: string;
    footer: { signatory_name: string; signatory_designation: string; show_date: boolean };
  },
  values: Record<string, string>,
  issueDate: string,
  assetBaseUrl?: string
): Promise<ArrayBuffer> {
  // First escape the entire raw body so all special chars are safe XML
  let body = xmlEscape(templateContent.body);
  // Now replace the encoded tags &lt;field&gt; with the (already-escaped) values
  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`&lt;\\s*${escapeRegex(key)}\\s*&gt;`, "gi");
    body = body.replace(pattern, xmlEscape(value));
  }

  const institutionLines = (templateContent.header.institution_name || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => xmlEscape(line));
  const certTitle = xmlEscape(templateContent.header.certificate_title || "CERTIFICATE");
  const signatoryName = xmlEscape(templateContent.footer.signatory_name || "Principal");
  const signatoryDesig = xmlEscape(templateContent.footer.signatory_designation || "");
  const showDate = templateContent.footer.show_date;
  const logoAsset = await fetchLogoAsset(templateContent.header.logo_url || "", assetBaseUrl);

  const headerParagraphs = institutionLines.length > 0
    ? institutionLines
      .map((line, index) => {
        if (index === 0) {
          return `<w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="34"/></w:rPr><w:t>${line}</w:t></w:r>
    </w:p>`;
        }

        if (index === institutionLines.length - 1) {
          return `<w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>${line}</w:t></w:r>
    </w:p>`;
        }

        return `<w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="18"/></w:rPr><w:t>${line}</w:t></w:r>
    </w:p>`;
      })
      .join("\n")
    : `<w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="34"/></w:rPr><w:t>ST. PETER&apos;S COLLEGE OF ENGINEERING &amp; TECHNOLOGY</w:t></w:r>
    </w:p>`;

  // Convert body to Word XML paragraphs (preserving line breaks)
  const bodyParagraphs = body
    .split("\n")
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`)
    .join("\n");

  const logoParagraph = logoAsset
    ? `<w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="1143000" cy="1143000"/>
            <wp:docPr id="1" name="SPCET Logo"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="SPCET Logo"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rId2" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="1143000" cy="1143000"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`
    : "";

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${logoParagraph}
    ${headerParagraphs}
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:u w:val="single"/></w:rPr><w:t>${certTitle}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    ${bodyParagraphs}
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9000" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/>
          <w:bottom w:val="none"/><w:right w:val="none"/>
          <w:insideH w:val="none"/><w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="4500" w:type="dxa"/></w:tcPr>
          ${showDate
      ? `<w:p><w:r><w:t>Date: ${xmlEscape(issueDate)}</w:t></w:r></w:p>`
      : `<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>`}
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4500" w:type="dxa"/></w:tcPr>
          <w:p>
            <w:pPr><w:jc w:val="right"/></w:pPr>
            <w:r><w:rPr><w:b/></w:rPr><w:t>${signatoryName}</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:jc w:val="right"/></w:pPr>
            <w:r><w:t>${signatoryDesig}</w:t></w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:sectPr/>
  </w:body>
</w:document>`;

  const zip = new JSZip();
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${logoAsset ? `<Default Extension="${logoAsset.extension}" ContentType="${logoAsset.contentType}"/>` : ""}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
  zip.file("[Content_Types].xml", contentTypes);
  zip.folder("_rels")!.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.folder("word")!.folder("_rels")!.file(
    "document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${logoAsset ? `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.${logoAsset.extension}"/>` : ""}
</Relationships>`
  );
  if (logoAsset) {
    zip.folder("word")!.folder("media")!.file(`logo.${logoAsset.extension}`, logoAsset.bytes);
  }
  zip.folder("word")!.file("document.xml", documentXml);

  return zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log("Edge Function invoked");

    // Verify user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use anon key for user verification, but fallback to service role if needed?
    // Actually, createClient with anon key is the correct way to verify a JWT.
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLIC_ANON_KEY");
    if (!anonKey) {
      return new Response(JSON.stringify({ error: "Internal Error: SUPABASE_ANON_KEY not set in Edge Function" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({
        error: `Unauthorized: ${authError?.message || "Invalid or expired token"}`,
        details: authError
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User authenticated:", user.id);

    const { certificateId } = await req.json();
    if (!certificateId) {
      return new Response(JSON.stringify({ error: "Missing certificateId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch certificate
    const { data: cert, error: certErr } = await supabase
      .from("certificates")
      .select("*")
      .eq("id", certificateId)
      .single();

    if (certErr || !cert) {
      console.error("Certificate fetch error:", certErr);
      return new Response(JSON.stringify({ error: "Certificate not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Certificate found:", cert.id, "Status:", cert.status);

    if (cert.status !== "approved") {
      return new Response(JSON.stringify({ error: "Certificate not approved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check ownership
    // Check student ownership or admin status
    const { data: student } = await supabase
      .from("profiles")
      .select("id, full_name, roll_number, branch, year, section, degree, phone, email")
      .eq("user_id", user.id)
      .maybeSingle();

    // Check if user is admin or hod
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const isAdmin = roles?.some((r: any) => r.role === 'admin' || r.role === 'hod');

    if (!isAdmin && (!student || student.id !== cert.student_id)) {
      console.error("Access denied. User ID:", user.id, "Student ID:", student?.id, "Cert Student ID:", cert.student_id, "Is Admin/HOD:", isAdmin);
      return new Response(JSON.stringify({ error: "Access denied: You do not have permission to download this certificate." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine whose data to use (if admin is downloading, use the actual student's data)
    let certStudentData;
    if (isAdmin && (!student || student.id !== cert.student_id)) {
      const { data: targetStudent } = await supabase
        .from("profiles")
        .select("id, full_name, roll_number, branch, year, section, degree, phone, email")
        .eq("id", cert.student_id)
        .single();
      certStudentData = targetStudent;
    } else {
      certStudentData = student;
    }

    if (!certStudentData) {
      return new Response(JSON.stringify({ error: "Student data not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build common replacement values from student data
    const issueDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const fullName = certStudentData.full_name || "";
    const allValues: Record<string, string> = {
      name: fullName,
      full_name: fullName,
      register_number: certStudentData.roll_number || "",
      roll_number: certStudentData.roll_number || "",
      branch: certStudentData.branch || "",
      department: certStudentData.branch || "",
      year: certStudentData.year || "",
      section: certStudentData.section || "",
      degree: certStudentData.degree || "",
      email: certStudentData.email || "",
      phone: certStudentData.phone || "",
      date: issueDate,
    };

    // Resolve template — check custom application first, then certificate type
    const { data: customApp } = await supabase
      .from("custom_certificate_applications")
      .select(
        "*, certificate_templates(template_url, template_content, template_name, template_fields(field_name))"
      )
      .eq("certificate_id", certificateId)
      .maybeSingle();

    let templateUrl: string | null = null;
    let templateContent: any = null;
    let templateName = cert.certificate_type;
    let fieldValues: Record<string, string> = {};

    if (customApp?.certificate_templates) {
      const tmpl = customApp.certificate_templates as any;
      templateUrl = tmpl.template_url;
      templateContent = tmpl.template_content;
      templateName = tmpl.template_name;
      fieldValues = (customApp.field_values as Record<string, string>) || {};
    } else {
      const { data: template } = await supabase
        .from("certificate_templates")
        .select("template_url, template_content, template_name")
        .eq("certificate_type", cert.certificate_type)
        .eq("is_active", true)
        .maybeSingle();

      if (template) {
        templateUrl = (template as any).template_url;
        templateContent = (template as any).template_content;
        templateName = (template as any).template_name;
        fieldValues = (cert.form_data as Record<string, string>) || {};
      }
    }

    // Merge custom field values with field name mapping
    // Map common form field names to template placeholder names
    const fieldMapping: Record<string, string> = {
      fromDate: "start_date",
      toDate: "end_date",
      facultyName: "faculty_name",
      reason: "reason",
    };
    for (const [formKey, value] of Object.entries(fieldValues)) {
      const mappedKey = fieldMapping[formKey] || formKey;
      allValues[mappedKey] = String(value);
      // Also keep original key so both work
      allValues[formKey] = String(value);
    }

    const filename = `${templateName.replace(/\s+/g, "_")}_${certStudentData.id || "certificate"}.docx`;

    // ── PATH 1: Guided template_content JSON ─────────────────────────────────
    if (templateContent) {
      const requestOrigin = req.headers.get("origin") || req.headers.get("referer") || undefined;
      const docBuffer = await buildDocxFromContent(templateContent, allValues, issueDate, requestOrigin);
      return new Response(docBuffer as ArrayBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // ── PATH 2: Uploaded .docx / .pptx file ──────────────────────────────────
    if (!templateUrl) {
      return new Response(
        JSON.stringify({
          error:
            "No template configured. Please ask the Admin to design the certificate template.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const templateResponse = await fetch(templateUrl);
    if (!templateResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to download template file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateBuffer = await templateResponse.arrayBuffer();
    const zip = new JSZip();
    await zip.loadAsync(templateBuffer);

    const xmlFiles = [
      "word/document.xml",
      ...Object.keys(zip.files).filter(
        (p) =>
          (p.startsWith("word/header") || p.startsWith("word/footer")) && p.endsWith(".xml")
      ),
    ];

    for (const xmlPath of xmlFiles) {
      const xmlFile = zip.file(xmlPath);
      if (!xmlFile) continue;
      let xml = await xmlFile.async("string");

      // ── Merge adjacent <w:r> runs that share the same formatting ──
      // Word often splits text like <name> across multiple runs:
      //   <w:r><w:t>&lt;</w:t></w:r><w:r><w:t>name</w:t></w:r><w:r><w:t>&gt;</w:t></w:r>
      // This merges them so the tag is in one run and can be matched by regex.
      xml = xml.replace(
        /<\/w:t><\/w:r><w:r>(?:<w:rPr>(?:(?!<\/w:rPr>).)*<\/w:rPr>)?<w:t(?:\s[^>]*)?>/gs,
        ""
      );

      xml = safeReplaceTemplateFields(xml, allValues);

      zip.file(xmlPath, xml);
    }

    const filledDoc = await zip.generateAsync({ type: "arraybuffer" });

    return new Response(filledDoc as ArrayBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? (error.stack || error.message) : "Unknown error: " + String(error);
    console.error("Error generating certificate:", error);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
