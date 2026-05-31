const https = require('https');
const fs = require('fs');
const path = require('path');

const PAT = 'sbp_v0_4425debfe8601ee5386cee494f231a149fd4e4ec';
const PROJECT_REF = 'boymejjlnrlbfizavzgn';

// Execute a single SQL statement via Management API
function runSQL(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAT}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
                    }
                } catch (e) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ raw: data });
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
        req.write(body);
        req.end();
    });
}

// Split SQL into individual statements (handle $$ blocks correctly)
function splitStatements(sql) {
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    let dollarTag = '';

    const lines = sql.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        // Skip pure comment lines
        if (trimmed.startsWith('--') && !inDollarQuote) {
            continue;
        }

        current += line + '\n';

        // Detect $$ dollar quoting
        if (!inDollarQuote) {
            const match = current.match(/\$\$|\$[a-zA-Z_][a-zA-Z0-9_]*\$/);
            if (match) inDollarQuote = true;
        } else {
            // Look for closing $$
            if (current.split('$$').length - 1 >= 2 ||
                (current.match(/\$\$/g) || []).length % 2 === 0) {
                inDollarQuote = false;
            }
        }

        // If we see a semicolon outside of a dollar quote, split
        if (!inDollarQuote && trimmed.endsWith(';')) {
            const stmt = current.trim();
            if (stmt && stmt !== ';') {
                statements.push(stmt);
            }
            current = '';
        }
    }

    if (current.trim()) {
        statements.push(current.trim());
    }

    return statements.filter(s => s.length > 1 && !s.startsWith('--'));
}

async function main() {
    console.log('\n====================================================');
    console.log(' APPLYING MIGRATION TO SUPABASE');
    console.log(` Project: ${PROJECT_REF}`);
    console.log('====================================================\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260225000001_fix_critical_bugs.sql');

    if (!fs.existsSync(migrationPath)) {
        console.error('Migration file not found:', migrationPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Migration file loaded:', migrationPath);

    // Run the entire migration as one query (Management API handles multi-statement)
    console.log('\nExecuting migration...\n');

    // Define migration steps explicitly for better error reporting
    const steps = [
        {
            name: "Add 'authority' to app_role enum",
            sql: `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'authority';`
        },
        {
            name: "Create authority_profiles table",
            sql: `
        CREATE TABLE IF NOT EXISTS public.authority_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          display_name TEXT NOT NULL,
          role_title TEXT NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(user_id)
        );`
        },
        {
            name: "Enable RLS on authority_profiles",
            sql: `ALTER TABLE public.authority_profiles ENABLE ROW LEVEL SECURITY;`
        },
        {
            name: "RLS: Admins manage authority profiles",
            sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='authority_profiles' AND policyname='Admins can manage authority profiles') THEN
          CREATE POLICY "Admins can manage authority profiles" ON public.authority_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
        END IF;
      END $$;`
        },
        {
            name: "RLS: Authority view own profile",
            sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='authority_profiles' AND policyname='Authority users can view their own profile') THEN
          CREATE POLICY "Authority users can view their own profile" ON public.authority_profiles FOR SELECT USING (user_id = auth.uid());
        END IF;
      END $$;`
        },
        {
            name: "RLS: HODs view all authority profiles",
            sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='authority_profiles' AND policyname='HODs can view all authority profiles') THEN
          CREATE POLICY "HODs can view all authority profiles" ON public.authority_profiles FOR SELECT USING (public.has_role(auth.uid(), 'hod'));
        END IF;
      END $$;`
        },
        {
            name: "Create template_approval_chain table",
            sql: `
        CREATE TABLE IF NOT EXISTS public.template_approval_chain (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
          authority_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          approval_order INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(template_id, approval_order),
          UNIQUE(template_id, authority_user_id)
        );`
        },
        {
            name: "Enable RLS on template_approval_chain",
            sql: `ALTER TABLE public.template_approval_chain ENABLE ROW LEVEL SECURITY;`
        },
        {
            name: "RLS: Admins manage approval chains",
            sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='template_approval_chain' AND policyname='Admins can manage approval chains') THEN
          CREATE POLICY "Admins can manage approval chains" ON public.template_approval_chain FOR ALL USING (public.has_role(auth.uid(), 'admin'));
        END IF;
      END $$;`
        },
        {
            name: "RLS: Authenticated view approval chains",
            sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='template_approval_chain' AND policyname='Authenticated users can view approval chains') THEN
          CREATE POLICY "Authenticated users can view approval chains" ON public.template_approval_chain FOR SELECT USING (auth.uid() IS NOT NULL);
        END IF;
      END $$;`
        },
        {
            name: "Create certificate_approvals table",
            sql: `
        CREATE TABLE IF NOT EXISTS public.certificate_approvals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
          authority_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          approval_order INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          remarks TEXT,
          acted_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(certificate_id, approval_order)
        );`
        },
        {
            name: "Enable RLS on certificate_approvals",
            sql: `ALTER TABLE public.certificate_approvals ENABLE ROW LEVEL SECURITY;`
        },
        {
            name: "RLS policies for certificate_approvals",
            sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certificate_approvals' AND policyname='Admins can view all approvals') THEN
          CREATE POLICY "Admins can view all approvals" ON public.certificate_approvals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certificate_approvals' AND policyname='HODs can view all approvals') THEN
          CREATE POLICY "HODs can view all approvals" ON public.certificate_approvals FOR SELECT USING (public.has_role(auth.uid(), 'hod'));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certificate_approvals' AND policyname='Authority users can view their own approvals') THEN
          CREATE POLICY "Authority users can view their own approvals" ON public.certificate_approvals FOR SELECT USING (authority_user_id = auth.uid());
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certificate_approvals' AND policyname='Authority users can update their own approvals') THEN
          CREATE POLICY "Authority users can update their own approvals" ON public.certificate_approvals FOR UPDATE USING (authority_user_id = auth.uid());
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certificate_approvals' AND policyname='System can insert approvals') THEN
          CREATE POLICY "System can insert approvals" ON public.certificate_approvals FOR INSERT WITH CHECK (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certificate_approvals' AND policyname='Students can view approvals on their certificates') THEN
          CREATE POLICY "Students can view approvals on their certificates" ON public.certificate_approvals FOR SELECT USING (
            certificate_id IN (SELECT c.id FROM public.certificates c JOIN public.profiles p ON c.student_id = p.id WHERE p.user_id = auth.uid())
          );
        END IF;
      END $$;`
        },
        {
            name: "Create indexes on certificate_approvals",
            sql: `
        CREATE INDEX IF NOT EXISTS idx_cert_approvals_certificate_id ON public.certificate_approvals(certificate_id);
        CREATE INDEX IF NOT EXISTS idx_cert_approvals_authority_user_id ON public.certificate_approvals(authority_user_id);`
        },
        {
            name: "Create auto-approval trigger function",
            sql: `
        CREATE OR REPLACE FUNCTION public.create_approval_steps_on_cert_submit()
        RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
        AS $$
        BEGIN
          INSERT INTO public.certificate_approvals (certificate_id, authority_user_id, approval_order)
          SELECT NEW.id, tac.authority_user_id, tac.approval_order
          FROM public.template_approval_chain tac
          JOIN public.certificate_templates ct ON tac.template_id = ct.id
          WHERE ct.certificate_type = NEW.certificate_type
          ORDER BY tac.approval_order;
          RETURN NEW;
        END;
        $$;`
        },
        {
            name: "Create approval trigger on certificates",
            sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_certificate_submitted_create_approvals') THEN
          CREATE TRIGGER on_certificate_submitted_create_approvals
          AFTER INSERT ON public.certificates
          FOR EACH ROW EXECUTE FUNCTION public.create_approval_steps_on_cert_submit();
        END IF;
      END $$;`
        },
        {
            name: "Enable realtime for certificate_approvals",
            sql: `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='certificate_approvals') THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.certificate_approvals;
        END IF;
      END $$;`
        },
        {
            name: "Seed missing certificate templates (Bonafide, Conduct, Training)",
            sql: `
        INSERT INTO public.certificate_templates (certificate_type, template_name, description, is_active)
        VALUES
          ('bonafide', 'Bonafide Certificate', 'Certificate confirming student enrollment status', true),
          ('conduct', 'Conduct Certificate', 'Certificate confirming good conduct during study period', true),
          ('training', 'Training Certificate', 'Certificate for participation in training programs', true)
        ON CONFLICT DO NOTHING;`
        },
        {
            name: "Verify: count templates",
            sql: `SELECT certificate_type, template_name, is_active FROM public.certificate_templates ORDER BY certificate_type;`
        },
        {
            name: "Verify: check authority in enum",
            sql: `SELECT unnest(enum_range(NULL::public.app_role)) AS role_values;`
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const step of steps) {
        process.stdout.write(`  [${passed + failed + 1}/${steps.length}] ${step.name}... `);
        try {
            const result = await runSQL(step.sql.trim());
            console.log('✅');
            // Print result for verify steps
            if (step.name.startsWith('Verify') && result) {
                console.log('    Result:', JSON.stringify(result).slice(0, 300));
            }
            passed++;
        } catch (err) {
            console.log('❌');
            console.log(`    Error: ${err.message.slice(0, 200)}`);
            // Don't fail on "already exists" errors
            if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                console.log('    (Skipped — already exists)');
                passed++;
            } else {
                failed++;
            }
        }
    }

    console.log('\n====================================================');
    console.log(` DONE: ${passed} passed, ${failed} failed`);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
