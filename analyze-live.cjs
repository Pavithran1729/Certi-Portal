#!/usr/bin/env node

/**
 * Comprehensive Live Database Analysis via Supabase REST API
 * No direct DB password needed
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://boymejjlnrlbfizavzgn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU3MzA0MCwiZXhwIjoyMDg2MTQ5MDQwfQ.T6neKk2rtSq44W1iXhaReNR_GPVALk0hJECOXxq6iYk';

const analysis = {
  timestamp: new Date().toISOString(),
  database: 'boymejjlnrlbfizavzgn',
  url: SUPABASE_URL,
  sections: {}
};

/**
 * Make HTTPS request
 */
function httpsRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Get introspection data from Supabase
 */
async function queryRest(table, select = '*', filters = {}) {
  console.log(`  → Querying ${table}...`);
  
  try {
    let path = `/rest/v1/${table}?${select}`;
    
    for (const [key, value] of Object.entries(filters)) {
      path += `&${key}=${encodeURIComponent(value)}`;
    }

    const response = await httpsRequest('GET', path);
    
    if (response.status === 200) {
      return response.data || [];
    } else {
      console.warn(`  ⚠️  Query failed: ${response.status}`);
      return [];
    }
  } catch (e) {
    console.error(`  ⚠️  Error: ${e.message}`);
    return [];
  }
}

/**
 * Get all tables
 */
async function getTables() {
  console.log('\n📊 Fetching table information...');
  
  try {
    // Use information_schema if available via REST
    const tables = await queryRest('information_schema.tables', 
      'select=table_name,table_schema',
      { 'table_schema': 'eq.public' }
    );

    if (tables.length === 0) {
      // Fallback: query known tables
      const knownTables = [
        'users', 'roles', 'certificates', 'templates', 
        'authorities', 'approvals', 'template_content', 'approval_chains'
      ];
      
      const results = [];
      for (const table of knownTables) {
        try {
          const sample = await queryRest(table, 'select=*', { limit: '1' });
          if (sample && sample.length >= 0) {
            const columns = sample.length > 0 ? Object.keys(sample[0]) : [];
            results.push({
              table_name: table,
              table_schema: 'public',
              columns: columns.map(name => ({ name }))
            });
          }
        } catch (e) {
          // Table doesn't exist
        }
      }
      return results;
    }

    // Get column info for each table
    const tablesWithColumns = [];
    for (const table of tables) {
      try {
        const sample = await queryRest(table.table_name, 'select=*', { limit: '1' });
        const columns = sample.length > 0 ? Object.keys(sample[0]) : [];
        tablesWithColumns.push({
          table_name: table.table_name,
          table_schema: table.table_schema,
          columns: columns.map(name => ({ name }))
        });
      } catch (e) {
        // Skip error
      }
    }
    
    return tablesWithColumns;
  } catch (e) {
    console.error(`  ⚠️  Error: ${e.message}`);
    return [];
  }
}

/**
 * Get all data from a table with statistics
 */
async function getTableData(tableName) {
  console.log(`  → Fetching ${tableName}...`);
  
  try {
    const data = await queryRest(tableName, 'select=*');
    return data || [];
  } catch (e) {
    console.error(`  ⚠️  Error fetching ${tableName}: ${e.message}`);
    return [];
  }
}

/**
 * Get row counts for all tables
 */
async function getRowCounts() {
  console.log('\n📈 Fetching row counts...');
  
  const tables = [
    'users', 'roles', 'certificates', 'templates',
    'authorities', 'approvals', 'template_content', 'approval_chains'
  ];
  
  const counts = {};
  
  for (const table of tables) {
    try {
      // Use HEAD request to get count
      const response = await httpsRequest(
        'GET',
        `/rest/v1/${table}?select=count()`,
        { 'Prefer': 'count=exact' }
      );
      
      const countHeader = response.headers['content-range'];
      const count = countHeader ? 
        parseInt(countHeader.split('/')[1]) : 0;
      
      counts[table] = {
        row_count: count,
        status: 'ok'
      };
    } catch (e) {
      counts[table] = {
        row_count: 0,
        status: 'error',
        error: e.message
      };
    }
  }
  
  return counts;
}

/**
 * Get certificate breakdown
 */
async function getCertificateBreakdown() {
  console.log('\n🎓 Fetching certificate breakdown...');
  
  try {
    const certs = await getTableData('certificates');
    
    const breakdown = {
      total_count: certs.length,
      by_type: {},
      by_status: {},
      by_type_and_status: {}
    };
    
    for (const cert of certs) {
      if (cert.type) {
        breakdown.by_type[cert.type] = (breakdown.by_type[cert.type] || 0) + 1;
      }
      if (cert.status) {
        breakdown.by_status[cert.status] = (breakdown.by_status[cert.status] || 0) + 1;
      }
      if (cert.type && cert.status) {
        const key = `${cert.type}:${cert.status}`;
        breakdown.by_type_and_status[key] = (breakdown.by_type_and_status[key] || 0) + 1;
      }
    }
    
    return breakdown;
  } catch (e) {
    console.error(`  ⚠️  Error: ${e.message}`);
    return { total_count: 0, by_type: {}, by_status: {}, by_type_and_status: {} };
  }
}

/**
 * Get user roles distribution
 */
async function getUserRolesDistribution() {
  console.log('\n👥 Fetching user roles distribution...');
  
  try {
    const users = await getTableData('users');
    
    const distribution = {};
    for (const user of users) {
      const role = user.role || 'unassigned';
      distribution[role] = (distribution[role] || 0) + 1;
    }
    
    return distribution;
  } catch (e) {
    console.error(`  ⚠️  Error: ${e.message}`);
    return {};
  }
}

/**
 * Get template configurations
 */
async function getTemplateConfigurations() {
  console.log('\n🎨 Fetching template configurations...');
  
  try {
    const templates = await getTableData('templates');
    const templateContent = await getTableData('template_content');
    
    const contentByTemplate = {};
    for (const content of templateContent) {
      const templateId = content.template_id;
      if (!contentByTemplate[templateId]) {
        contentByTemplate[templateId] = [];
      }
      contentByTemplate[templateId].push(content);
    }
    
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      is_active: template.is_active,
      content_sections: (contentByTemplate[template.id] || []).length,
      created_at: template.created_at,
      updated_at: template.updated_at
    }));
  } catch (e) {
    console.error(`  ⚠️  Error: ${e.message}`);
    return [];
  }
}

/**
 * Get approval chain configurations
 */
async function getApprovalChainConfigurations() {
  console.log('\n⛓️  Fetching approval chain configurations...');
  
  try {
    const chains = await getTableData('approval_chains');
    const approvals = await getTableData('approvals');
    
    const approvalsByChain = {};
    for (const approval of approvals) {
      const chainId = approval.chain_id;
      if (!approvalsByChain[chainId]) {
        approvalsByChain[chainId] = [];
      }
      approvalsByChain[chainId].push(approval);
    }
    
    return chains.map(chain => ({
      chain_id: chain.id,
      name: chain.name,
      certificate_types: chain.certificate_types || [],
      is_active: chain.is_active,
      approver_count: (approvalsByChain[chain.id] || []).length,
      approvers: approvalsByChain[chain.id] || [],
      created_at: chain.created_at,
      updated_at: chain.updated_at
    }));
  } catch (e) {
    console.error(`  ⚠️  Error: ${e.message}`);
    return [];
  }
}

/**
 * Get authorities list
 */
async function getAuthorities() {
  console.log('\n🔐 Fetching authorities...');
  
  try {
    const authorities = await getTableData('authorities');
    return authorities;
  } catch (e) {
    console.error(`  ⚠️  Error: ${e.message}`);
    return [];
  }
}

/**
 * Get roles list
 */
async function getRoles() {
  console.log('\n👔 Fetching roles...');
  
  try {
    const roles = await getTableData('roles');
    return roles;
  } catch (e) {
    console.error(`  ⚠️  Error: ${e.message}`);
    return [];
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Comprehensive Database Analysis!');
  console.log(`📅 ${analysis.timestamp}`);
  console.log(`🌐 Database: ${analysis.database}`);
  console.log(`🔑 Using Service Role Key`);

  try {
    // Fetch all data
    analysis.sections.tables = await getTables();
    analysis.sections.row_counts = await getRowCounts();
    analysis.sections.certificate_breakdown = await getCertificateBreakdown();
    analysis.sections.user_roles = await getUserRolesDistribution();
    analysis.sections.templates = await getTemplateConfigurations();
    analysis.sections.approval_chains = await getApprovalChainConfigurations();
    analysis.sections.authorities = await getAuthorities();
    analysis.sections.roles = await getRoles();

    console.log('\n✅ Analysis complete!');
    return analysis;
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Execute
main().then(result => {
  const outputDir = path.join(__dirname, 'plans');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'database-analysis.json');
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`\n💾 Saved to: ${outputFile}`);

  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
