/**
 * CESI HR Health Check — Lead Capture Module
 * hc-lead.js v1.0
 *
 * ── EmailJS 設定（需填入）────────────────────────────────
 * 1. 至 https://www.emailjs.com 免費註冊
 * 2. 建立 Email Service（Gmail 或 SMTP）
 * 3. 建立 Email Template，變數請見下方 sendEmail()
 * 4. 將 PUBLIC_KEY、SERVICE_ID、TEMPLATE_ID 填入下方
 * ─────────────────────────────────────────────────────────
 */
const HCL_EMAILJS = {
  publicKey:  '',   // e.g. 'user_xxxxxxxxxxxxxxx'
  serviceId:  '',   // e.g. 'service_gmail'
  templateId: '',   // e.g. 'template_hc_report'
};

/** 後台管理密碼（請改為自訂密碼） */
const HCL_ADMIN_PWD = 'CESI@2025';

/** localStorage key */
const HCL_STORE = 'hcl_leads';

/** 後端 API（若後端已支援 /api/leads 可啟用） */
const HCL_API = 'https://cesi-hr-api-626216288020.asia-east1.run.app';

// ─── Inject styles ────────────────────────────────────────────────────────────
(function injectStyles() {
  if (document.getElementById('hcl-styles')) return;
  const s = document.createElement('style');
  s.id = 'hcl-styles';
  s.textContent = `
.hcl-overlay{position:fixed;inset:0;background:rgba(7,20,47,.72);z-index:9000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)}
.hcl-modal{background:#fbf8ef;border-radius:16px;width:min(480px,92vw);overflow:hidden;box-shadow:0 24px 80px rgba(7,20,47,.35);animation:hclIn .32s ease}
@keyframes hclIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.hcl-top{background:linear-gradient(135deg,#4c315f,#10244c);padding:22px 24px 20px;text-align:center}
.hcl-top h2{font-family:'Noto Serif TC',serif;font-size:18px;font-weight:900;color:#fff;margin-bottom:4px}
.hcl-top p{color:rgba(255,255,255,.72);font-size:12px;line-height:1.6}
.hcl-body{padding:22px 24px 26px}
.hcl-hint{background:rgba(76,49,95,.07);border-left:3px solid #4c315f;border-radius:4px;padding:10px 14px;font-size:12px;color:#4c315f;margin-bottom:16px;line-height:1.7}
.hcl-field{margin-bottom:12px}
.hcl-field label{display:block;font-size:12px;font-weight:700;color:#182036;margin-bottom:4px}
.hcl-field label .req{color:#c34646;margin-left:2px}
.hcl-field label .opt{color:#8b94a7;font-weight:400;margin-left:4px}
.hcl-field input{width:100%;padding:10px 13px;border:1.5px solid rgba(16,36,76,.14);border-radius:8px;font:inherit;font-size:14px;color:#182036;background:#fff;transition:border-color .2s}
.hcl-field input:focus{outline:none;border-color:#4c315f}
.hcl-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hcl-submit{width:100%;background:linear-gradient(135deg,#4c315f,#10244c);color:#fff;border:none;padding:13px;border-radius:8px;font:inherit;font-size:15px;font-weight:700;cursor:pointer;margin-top:6px;transition:opacity .2s}
.hcl-submit:hover{opacity:.88}
.hcl-submit:disabled{opacity:.45;cursor:not-allowed}
.hcl-privacy{font-size:11px;color:#8b94a7;text-align:center;margin-top:10px;line-height:1.6}
.hcl-err{font-size:12px;color:#c34646;margin-top:4px;display:none}
.hcl-sending{display:none;text-align:center;padding:8px;color:#4c315f;font-size:13px}
  `;
  document.head.appendChild(s);
})();

// ─── Inject modal HTML ────────────────────────────────────────────────────────
(function injectModal() {
  if (document.getElementById('hcl-overlay')) return;
  const div = document.createElement('div');
  div.id = 'hcl-overlay';
  div.className = 'hcl-overlay';
  div.style.display = 'none';
  div.innerHTML = `
<div class="hcl-modal">
  <div class="hcl-top">
    <h2 id="hcl-title">📊 填寫聯絡資料以查看完整報告</h2>
    <p>報告將同步寄送至您的信箱，方便日後參考</p>
  </div>
  <div class="hcl-body">
    <div class="hcl-hint">您的問卷已完成！<br>填寫以下資料即可立即查看 AI 診斷報告，並取得一份精美版本至信箱。</div>
    <div class="hcl-row2">
      <div class="hcl-field">
        <label>姓名<span class="req">*</span></label>
        <input id="hcl-name" type="text" placeholder="王小明" autocomplete="name">
        <div class="hcl-err" id="hcl-name-err">請填寫姓名</div>
      </div>
      <div class="hcl-field">
        <label>職稱<span class="opt">選填</span></label>
        <input id="hcl-title" type="text" placeholder="人資主任">
      </div>
    </div>
    <div class="hcl-field">
      <label>公司名稱<span class="opt">選填</span></label>
      <input id="hcl-company" type="text" placeholder="XX科技股份有限公司">
    </div>
    <div class="hcl-field">
      <label>電子信箱<span class="req">*</span>（報告寄送）</label>
      <input id="hcl-email" type="email" placeholder="your@email.com" autocomplete="email">
      <div class="hcl-err" id="hcl-email-err">請填寫正確的Email</div>
    </div>
    <div class="hcl-field">
      <label>手機號碼<span class="req">*</span></label>
      <input id="hcl-phone" type="tel" placeholder="0912 345 678" autocomplete="tel">
      <div class="hcl-err" id="hcl-phone-err">請填寫手機號碼</div>
    </div>
    <button class="hcl-submit" id="hcl-submit-btn" onclick="HCLead._submit()">查看完整診斷報告 →</button>
    <div class="hcl-sending" id="hcl-sending">⏳ 儲存中，請稍候…</div>
    <div class="hcl-privacy">送出即表示您同意策識永續依<strong>個人資料保護法</strong>蒐集、處理及利用您的個人資料，<br>僅用於服務溝通及報告寄送，不做其他商業用途。</div>
  </div>
</div>`;
  document.body.appendChild(div);
})();

// ─── Core module ─────────────────────────────────────────────────────────────
window.HCLead = (function() {
  let _toolId   = '';
  let _toolName = '';
  let _meta     = {};
  let _callback = null;
  let _currentId = null;

  /** Called by each tool before showing result */
  function gate(toolId, toolName, meta, onGranted) {
    _toolId   = toolId;
    _toolName = toolName;
    _meta     = meta || {};
    _callback = onGranted;
    document.getElementById('hcl-title').textContent = '📊 填寫聯絡資料以查看完整報告';
    _clearForm();
    document.getElementById('hcl-overlay').style.display = 'flex';
    setTimeout(function() {
      var n = document.getElementById('hcl-name');
      if (n) n.focus();
    }, 150);
  }

  /** Called after AI streaming completes with the full report text */
  function reportDone(text) {
    if (!_currentId) return;
    // Update stored record with AI report text
    var leads = _load();
    var rec = leads.find(function(l) { return l.id === _currentId; });
    if (rec) {
      rec.reportText = text;
      _save(leads);
    }
    // Send email
    _sendEmail(_currentId, text);
  }

  function _submit() {
    var nameEl  = document.getElementById('hcl-name');
    var emailEl = document.getElementById('hcl-email');
    var ok = true;
    document.querySelectorAll('.hcl-err').forEach(function(e) { e.style.display='none'; });
    if (!nameEl.value.trim()) {
      document.getElementById('hcl-name-err').style.display = 'block';
      ok = false;
    }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailEl.value.trim())) {
      document.getElementById('hcl-email-err').style.display = 'block';
      ok = false;
    }
    var phoneEl = document.getElementById('hcl-phone');
    if (!phoneEl.value.trim()) {
      document.getElementById('hcl-phone-err').style.display = 'block';
      ok = false;
    }
    if (!ok) return;

    var lead = {
      name:    nameEl.value.trim(),
      title:   document.getElementById('hcl-title').value.trim(),
      company: document.getElementById('hcl-company').value.trim(),
      email:   emailEl.value.trim(),
      phone:   document.getElementById('hcl-phone').value.trim(),
    };

    document.getElementById('hcl-submit-btn').disabled = true;
    document.getElementById('hcl-sending').style.display = 'block';

    var record = {
      id:       _uid(),
      ts:       new Date().toISOString(),
      toolId:   _toolId,
      toolName: _toolName,
      lead:     lead,
      result:   _meta,
      reportText: '',
    };
    _currentId = record.id;

    // Save to localStorage
    var leads = _load();
    leads.push(record);
    _save(leads);

    // Try to POST to backend (non-blocking)
    _postToServer(record);

    // Close modal and invoke callback
    setTimeout(function() {
      document.getElementById('hcl-overlay').style.display = 'none';
      document.getElementById('hcl-submit-btn').disabled = false;
      document.getElementById('hcl-sending').style.display = 'none';
      if (_callback) _callback(lead);
    }, 300);
  }

  function _sendEmail(id, reportText) {
    if (!HCL_EMAILJS.publicKey || !HCL_EMAILJS.serviceId || !HCL_EMAILJS.templateId) return;
    if (typeof emailjs === 'undefined') {
      console.warn('[HCLead] EmailJS SDK not loaded. Add <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"> before hc-lead.js.');
      return;
    }
    var leads = _load();
    var rec = leads.find(function(l) { return l.id === id; });
    if (!rec || !rec.lead) return;

    emailjs.init({ publicKey: HCL_EMAILJS.publicKey });
    var params = {
      to_name:      rec.lead.name,
      to_email:     rec.lead.email,
      company:      rec.lead.company || '（未填寫）',
      job_title:    rec.lead.title  || '（未填寫）',
      tool_name:    rec.toolName,
      result_level: (rec.result && rec.result.level) ? rec.result.level + '度風險' : '已完成',
      result_score: (rec.result && rec.result.score != null) ? rec.result.score + '%' : '',
      report_text:  reportText ? reportText.slice(0, 3000) : '',
      report_date:  new Date().toLocaleDateString('zh-TW', { year:'numeric', month:'long', day:'numeric' }),
      cesi_phone:   '02-XXXX-XXXX',
      cesi_email:   'service@cesi.com.tw',
    };
    emailjs.send(HCL_EMAILJS.serviceId, HCL_EMAILJS.templateId, params)
      .then(function() { console.log('[HCLead] Email sent to', rec.lead.email); })
      .catch(function(e) { console.warn('[HCLead] Email failed:', e); });
  }

  function _postToServer(record) {
    try {
      fetch(HCL_API + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(function() {});
    } catch(e) {}
  }

  function _load() {
    try { return JSON.parse(localStorage.getItem(HCL_STORE) || '[]'); } catch(e) { return []; }
  }
  function _save(arr) {
    try { localStorage.setItem(HCL_STORE, JSON.stringify(arr)); } catch(e) {}
  }
  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function _clearForm() {
    ['hcl-name','hcl-title','hcl-company','hcl-email','hcl-phone'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.hcl-err').forEach(function(e) { e.style.display='none'; });
  }

  /** Admin helpers (used by admin-health-check.html) */
  function getAllLeads() { return _load().reverse(); }
  function clearLeads()  { localStorage.removeItem(HCL_STORE); }
  function exportCSV() {
    var leads = _load();
    var hdr = ['ID','時間','工具','姓名','職稱','公司','Email','電話','風險等級','分數'];
    var rows = leads.map(function(l) {
      return [
        l.id,
        new Date(l.ts).toLocaleString('zh-TW'),
        l.toolName,
        l.lead.name,
        l.lead.title,
        l.lead.company,
        l.lead.email,
        l.lead.phone,
        (l.result && l.result.level) ? l.result.level + '度' : '',
        (l.result && l.result.score != null) ? l.result.score + '%' : '',
      ];
    });
    var csv = [hdr].concat(rows).map(function(r) {
      return r.map(function(v) { return '"' + String(v||'').replace(/"/g,'""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'hc-leads-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click(); URL.revokeObjectURL(url);
  }

  return { gate: gate, reportDone: reportDone, _submit: _submit, getAllLeads: getAllLeads, clearLeads: clearLeads, exportCSV: exportCSV, _uid: _uid };
})();
