/**
 * seed-templates.cjs
 * Generates minimal valid .docx files for each template that has no file yet,
 * uploads to Supabase Storage, and updates the DB template_url.
 * Uses ONLY jszip (already in node_modules) - zero extra packages needed.
 */
const { createClient } = require("@supabase/supabase-js");
const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

// Direct credentials (same as test-supabase-js.cjs)
const SUPABASE_URL = "https://boymejjlnrlbfizavzgn.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU3MzA0MCwiZXhwIjoyMDg2MTQ5MDQwfQ.T6neKk2rtSq44W1iXhaReNR_GPVALk0hJECOXxq6iYk";

// Service role bypasses RLS - no login needed!
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function buildDocumentXml(templateName, fields) {
    const rows = fields.length > 0
        ? fields.map(f =>
            `<w:p>
          <w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${f.label}: </w:t></w:r>
          <w:r><w:rPr><w:i/></w:rPr><w:t>&lt;${f.name}&gt;</w:t></w:r>
        </w:p>`
        ).join("\n")
        : `<w:p><w:r><w:t>No fields configured yet.</w:t></w:r></w:p>`;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
        <w:t>St. Peter&apos;s College of Engineering and Technology</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
        <w:t>${templateName.toUpperCase()}</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>This is to certify that the following details are true and correct:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    ${rows}
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Principal / Authorized Signatory</w:t></w:r>
    </w:p>
    <w:sectPr/>
  </w:body>
</w:document>`;
}

async function buildDocx(templateName, fields) {
    const zip = new JSZip();

    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

    zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`);

    zip.folder("word").folder("_rels").file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

    zip.folder("word").file("document.xml", buildDocumentXml(templateName, fields));

    return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

async function run() {
    console.log("=== Template Seeder (Service Role) ===");

    const { data: templates, error } = await supabase
        .from("certificate_templates")
        .select("id, template_name, template_fields(field_name, field_label, match_required)")
        .is("template_url", null)
        .eq("is_active", true);

    if (error) {
        console.error("Failed to fetch templates:", error.message);
        return;
    }

    if (!templates || templates.length === 0) {
        console.log("All active templates already have files uploaded. Nothing to seed!");
        return;
    }

    console.log(`Found ${templates.length} template(s) to seed:`);
    templates.forEach(t => console.log(`  - ${t.template_name}`));

    for (const template of templates) {
        console.log(`\nProcessing: "${template.template_name}"...`);

        const fields = (template.template_fields || []).map(f => ({
            name: f.field_name,
            label: f.field_label,
        }));

        console.log(`  Fields: ${fields.length > 0 ? fields.map(f => f.name).join(", ") : "none"}`);

        const docxBuffer = await buildDocx(template.template_name, fields);
        const fileName = `${template.template_name.replace(/\s+/g, "_").toLowerCase()}_default.docx`;
        const storagePath = `seeded/${Date.now()}_${fileName}`;

        console.log(`  Uploading to: certificate-templates/${storagePath}`);

        const { error: uploadError } = await supabase.storage
            .from("certificate-templates")
            .upload(storagePath, docxBuffer, {
                contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                upsert: true,
            });

        if (uploadError) {
            console.error(`  UPLOAD FAILED:`, uploadError.message);
            continue;
        }

        const { data: publicUrlData } = supabase.storage
            .from("certificate-templates")
            .getPublicUrl(storagePath);

        const publicUrl = publicUrlData.publicUrl;
        console.log(`  Public URL: ${publicUrl}`);

        const { error: updateError } = await supabase
            .from("certificate_templates")
            .update({ template_url: publicUrl })
            .eq("id", template.id);

        if (updateError) {
            console.error(`  DB UPDATE FAILED:`, updateError.message);
        } else {
            // Save a local copy for inspection
            fs.writeFileSync(path.join(__dirname, fileName), docxBuffer);
            console.log(`  SUCCESS! Local copy saved: ${fileName}`);
        }
    }

    console.log("\n=== Done! Refresh the Admin Dashboard -> Templates tab. ===");
}

run().catch(console.error);
