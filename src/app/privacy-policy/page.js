export const metadata = {
  title: 'Privacy Policy - MKG Mobile Apps',
  description: 'Privacy Policy for APPEMPLOYEE and APP-DRIVER Mobile Applications'
}

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>Last Updated: December 11, 2025</p>

      <div style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '8px', marginBottom: '30px', borderLeft: '4px solid #3b82f6' }}>
        <p style={{ margin: 0, fontWeight: '500' }}>
          This Privacy Policy applies to both <strong>APPEMPLOYEE</strong> (Employee Management App) and <strong>APP-DRIVER</strong> (Operator & Driver App), 
          collectively referred to as "our applications" or "the apps".
        </p>
      </div>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>1. Introduction</h2>
        <p style={{ marginBottom: '15px' }}>
          Welcome to MKG Mobile Applications operated by CV. MAKKURAGA TAMA ("we," "our," or "us"). 
          These applications are designed for mining operations management, employee attendance tracking, equipment management, 
          and operational reporting.
        </p>
        <p>
          Please read this privacy policy carefully. By using our applications, you agree to the collection and use of information 
          in accordance with this policy. If you do not agree with any terms, please discontinue use of the applications.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>2. Applications Covered</h2>
        
        <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>📱 APPEMPLOYEE</h3>
          <p style={{ margin: 0 }}>
            For general employees, supervisors, managers, and HRD staff. Features include attendance check-in/check-out, 
            job assignments, approval workflows (timesheet, purchase requests, fund requests), and reporting.
          </p>
        </div>

        <div style={{ backgroundColor: '#dbeafe', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>🚛 APP-DRIVER</h3>
          <p style={{ margin: 0 }}>
            For heavy equipment operators and dump truck drivers. Features include attendance tracking, timesheet creation and management, 
            equipment plan assignments, offline data sync with SQLite, fuel consumption tracking, and AI-assisted data entry.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>3. Information We Collect</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.1 Personal Information</h3>
        <p style={{ marginBottom: '10px' }}>We collect the following personal information:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Identity Information:</strong> Full name, employee ID, username, email address, phone number</li>
          <li><strong>Employment Data:</strong> Job title, role, department, branch/business unit, shift schedule</li>
          <li><strong>Authentication Data:</strong> Password (encrypted), device ID, session tokens</li>
          <li><strong>Profile Photos:</strong> User profile images and selfies for attendance verification</li>
          <li><strong>Equipment Assignment:</strong> Assigned equipment, operator/driver license information</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.2 Location Data</h3>
        <p style={{ marginBottom: '10px' }}>We collect precise location data for:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Attendance Verification:</strong> GPS coordinates for check-in/check-out with geofencing validation</li>
          <li><strong>Work Location Tracking:</strong> Monitoring employee presence at designated work sites (mining pits, warehouses, offices)</li>
          <li><strong>Equipment Location:</strong> Tracking equipment operation locations for operational reporting</li>
          <li><strong>Nearest Location Detection:</strong> Finding the closest check-in location automatically</li>
        </ul>
        <p style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '6px', fontSize: '14px' }}>
          ⚠️ <strong>Note:</strong> Location data is collected only when you actively use attendance or timesheet features. 
          Background location tracking is NOT performed.
        </p>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.3 Operational Data</h3>
        <p style={{ marginBottom: '10px' }}>For mining operations management, we collect:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Timesheet Data:</strong> Work hours, shift details, equipment used, fuel consumption (BBM), service meter readings (SMU), activities performed</li>
          <li><strong>Equipment Data:</strong> Equipment type, serial number, operating hours, maintenance records, breakdown reports</li>
          <li><strong>Production Data:</strong> Material transported (ritase), tonnage, loading/unloading locations, customer information</li>
          <li><strong>Attendance Records:</strong> Check-in/check-out times, location coordinates, attendance photos, absence reasons</li>
          <li><strong>Job Assignments:</strong> Task details, assigned personnel, deadlines, task status (pending, accepted, rejected, completed)</li>
          <li><strong>Approval Workflows:</strong> Purchase requests, fund requests, timesheet approvals, approval decisions and comments</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.4 Photos and Media</h3>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Selfie Photos:</strong> For attendance verification and identity confirmation</li>
          <li><strong>Document Photos:</strong> Equipment condition reports, delivery orders, site photos</li>
          <li><strong>OCR Processing:</strong> Photos of paper forms for automatic data extraction using AI/OCR technology</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.5 Device Information</h3>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Device model, operating system (Android/iOS), app version</li>
          <li>Device ID for authentication and preventing account sharing</li>
          <li>Network information and IP address</li>
          <li>App usage statistics and crash reports for improving service quality</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.6 Offline Data (APP-DRIVER Only)</h3>
        <p>APP-DRIVER stores data locally on your device using SQLite database for offline functionality, including:</p>
        <ul style={{ marginLeft: '25px' }}>
          <li>Master data (locations, equipment, activities, materials)</li>
          <li>Pending timesheet submissions in sync queue</li>
          <li>User preferences and settings</li>
          <li>All offline data is encrypted and automatically synced when internet connection is available</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>4. How We Use Your Information</h2>
        <p style={{ marginBottom: '15px' }}>We use collected information for the following purposes:</p>
        
        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🎯 Core Operations</h4>
          <ul style={{ marginLeft: '20px', marginBottom: 0 }}>
            <li>Employee attendance tracking and verification</li>
            <li>Equipment operation monitoring and reporting</li>
            <li>Production tracking and performance analytics</li>
            <li>Fuel consumption monitoring and cost analysis</li>
            <li>Work assignment distribution and management</li>
            <li>Approval workflow processing</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🔐 Security & Authentication</h4>
          <ul style={{ marginLeft: '20px', marginBottom: 0 }}>
            <li>User authentication and account security</li>
            <li>Device binding to prevent unauthorized access</li>
            <li>Fraud prevention and abuse detection</li>
            <li>Audit logging for compliance and accountability</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>📊 Analytics & Reporting</h4>
          <ul style={{ marginLeft: '20px', marginBottom: 0 }}>
            <li>Generate operational reports (daily, weekly, monthly)</li>
            <li>Analyze productivity metrics and KPIs</li>
            <li>Equipment utilization and efficiency analysis</li>
            <li>Cost tracking and financial reporting</li>
            <li>Export reports to Excel and Google Sheets</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>📱 Service Improvement</h4>
          <ul style={{ marginLeft: '20px', marginBottom: 0 }}>
            <li>App performance optimization</li>
            <li>Bug fixes and troubleshooting</li>
            <li>User experience enhancement</li>
            <li>New feature development based on usage patterns</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>💬 Communication</h4>
          <ul style={{ marginLeft: '20px', marginBottom: 0 }}>
            <li>Send operational notifications and alerts</li>
            <li>Notify about pending tasks and approvals</li>
            <li>Provide system updates and announcements</li>
            <li>Integration with Telegram and WhatsApp for notifications</li>
          </ul>
        </div>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>5. Data Sharing and Disclosure</h2>
        <p style={{ marginBottom: '15px' }}>
          We do NOT sell, trade, or rent your personal information to third parties for marketing purposes. 
          We may share your information only in the following specific circumstances:
        </p>

        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', marginTop: '20px' }}>5.1 Within Your Organization</h3>
        <p>Information is shared with authorized personnel based on role-based access control:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Supervisors can view subordinate attendance and performance</li>
          <li>Managers can access departmental reports and analytics</li>
          <li>HRD can access attendance records and leave data</li>
          <li>Approvers can view and process approval requests</li>
        </ul>

        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', marginTop: '20px' }}>5.2 Service Providers</h3>
        <p>We use trusted third-party services that process data on our behalf:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>AWS (Amazon Web Services):</strong> Cloud storage for photos and documents (S3), OCR/text extraction (Textract)</li>
          <li><strong>Google Services:</strong> Maps API for location features, Sheets API for export, AI/Gemini for intelligent assistance</li>
          <li><strong>Expo Services:</strong> Push notifications and app updates</li>
          <li><strong>Communication Services:</strong> Telegram Bot API, WhatsApp API for notifications</li>
        </ul>
        <p style={{ fontSize: '14px', fontStyle: 'italic' }}>
          All service providers are bound by data processing agreements and are prohibited from using your data for their own purposes.
        </p>

        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', marginTop: '20px' }}>5.3 Legal Requirements</h3>
        <p>We may disclose information when required by law or to:</p>
        <ul style={{ marginLeft: '25px' }}>
          <li>Comply with legal processes (court orders, subpoenas, government requests)</li>
          <li>Enforce our Terms of Service</li>
          <li>Protect the rights, property, or safety of our company, users, or others</li>
          <li>Investigate fraud, security issues, or technical problems</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>6. Data Security</h2>
        <p style={{ marginBottom: '15px' }}>
          We implement comprehensive security measures to protect your personal information:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '15px', borderRadius: '8px', border: '1px solid #10b981' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🔒 Encryption</h4>
            <ul style={{ marginLeft: '20px', fontSize: '14px', marginBottom: 0 }}>
              <li>HTTPS/TLS encryption for all data transmission</li>
              <li>Password hashing with bcrypt</li>
              <li>JWT tokens for secure authentication</li>
              <li>Encrypted offline database (SQLite)</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🛡️ Access Controls</h4>
            <ul style={{ marginLeft: '20px', fontSize: '14px', marginBottom: 0 }}>
              <li>Role-based access control (RBAC)</li>
              <li>Device authentication and binding</li>
              <li>Session management with timeout</li>
              <li>Multi-level approval workflows</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>📱 Device Security</h4>
            <ul style={{ marginLeft: '20px', fontSize: '14px', marginBottom: 0 }}>
              <li>Device ID verification</li>
              <li>Secure storage for sensitive data</li>
              <li>Auto-logout on inactivity</li>
              <li>Biometric authentication support</li>
            </ul>
          </div>

          <div style={{ backgroundColor: '#fce7f3', padding: '15px', borderRadius: '8px', border: '1px solid #ec4899' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🔍 Monitoring</h4>
            <ul style={{ marginLeft: '20px', fontSize: '14px', marginBottom: 0 }}>
              <li>Activity logging and audit trails</li>
              <li>Intrusion detection systems</li>
              <li>Regular security assessments</li>
              <li>Incident response procedures</li>
            </ul>
          </div>
        </div>

        <p style={{ backgroundColor: '#fef2f2', padding: '15px', borderRadius: '8px', fontSize: '14px' }}>
          ⚠️ <strong>Important:</strong> While we implement industry-standard security measures, no method of transmission over the internet 
          or electronic storage is 100% secure. We cannot guarantee absolute security but continuously work to enhance our protection systems.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>7. Location Services</h2>
        <p style={{ marginBottom: '15px' }}>
          Our applications use location services extensively for operational purposes:
        </p>

        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', marginTop: '15px' }}>When Location is Collected:</h3>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Check-In/Check-Out:</strong> Precise location captured during attendance recording with photo</li>
          <li><strong>Timesheet Creation:</strong> Work location verification for equipment operation</li>
          <li><strong>Geofencing:</strong> Validation that you are within authorized work areas (configurable radius)</li>
          <li><strong>Nearest Location:</strong> Automatic detection of the closest check-in point</li>
        </ul>

        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', marginTop: '15px' }}>Location Controls:</h3>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>You control location permissions through your device settings (Settings → Apps → Permissions)</li>
          <li>Location is only collected when you actively use location-dependent features</li>
          <li>Background location tracking is NOT performed</li>
          <li>You can deny location permission, but this will limit attendance and timesheet features</li>
        </ul>

        <div style={{ backgroundColor: '#dbeafe', padding: '15px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>💡 Why Location is Required:</strong> Mining operations require accurate tracking of where equipment operates 
            and where employees are working for safety, compliance, and operational efficiency. Location data helps verify that 
            attendance is recorded at legitimate work sites and that equipment operates in designated areas.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>8. Offline Data Storage (APP-DRIVER)</h2>
        <p style={{ marginBottom: '15px' }}>
          APP-DRIVER includes offline functionality using local SQLite database storage:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Purpose:</strong> Allow timesheet creation and data entry even without internet connection</li>
          <li><strong>What's Stored Locally:</strong> Master data (equipment, locations, activities), pending timesheet submissions, user preferences</li>
          <li><strong>Encryption:</strong> Local database is encrypted using Expo SecureStore</li>
          <li><strong>Automatic Sync:</strong> Data automatically syncs to server when connection is restored</li>
          <li><strong>Retry Mechanism:</strong> Failed submissions are queued and retried automatically</li>
          <li><strong>Data Deletion:</strong> Offline data is cleared when you log out or uninstall the app</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>9. Data Retention</h2>
        <p style={{ marginBottom: '15px' }}>We retain your data for the following periods:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Active Employment:</strong> All data retained while you are an active employee</li>
          <li><strong>After Termination:</strong> Data retained for 3 years for compliance and legal requirements</li>
          <li><strong>Attendance Records:</strong> Retained for 5 years as required by labor regulations</li>
          <li><strong>Financial/Production Data:</strong> Retained for 7 years for tax and audit purposes</li>
          <li><strong>Photos:</strong> Attendance photos retained for 2 years, other operational photos as needed for records</li>
          <li><strong>Logs:</strong> System logs and audit trails retained for 1 year</li>
        </ul>
        <p style={{ fontSize: '14px', fontStyle: 'italic' }}>
          After retention periods expire, data is securely deleted or anonymized. You may request early deletion subject to legal and operational requirements.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>10. Your Rights</h2>
        <p style={{ marginBottom: '15px' }}>You have the following rights regarding your personal data:</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <strong>👁️ Right to Access:</strong> View all personal data we hold about you
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <strong>✏️ Right to Rectification:</strong> Correct inaccurate or incomplete data
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <strong>🗑️ Right to Deletion:</strong> Request deletion of your data (subject to legal requirements)
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <strong>⛔ Right to Object:</strong> Object to processing of your data
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <strong>📤 Right to Data Portability:</strong> Receive your data in machine-readable format
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <strong>🚫 Right to Withdraw Consent:</strong> Withdraw consent at any time
          </div>
        </div>

        <p style={{ marginTop: '15px', fontSize: '14px' }}>
          To exercise these rights, contact your HR department or email us at <strong>ayat.ekapoetra@gmail.com</strong>. 
          We will respond to requests within 30 days.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>11. Artificial Intelligence & Automation</h2>
        <p style={{ marginBottom: '15px' }}>Our applications use AI and automation technologies:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Google Gemini AI (APP-DRIVER):</strong> Chat assistant for helping operators fill timesheet forms with natural language input</li>
          <li><strong>AWS Textract OCR:</strong> Automatic extraction of data from scanned documents and photos of paper forms</li>
          <li><strong>Automated Validation:</strong> Rule-based validation of data entries (e.g., fuel consumption limits, SMU ranges)</li>
        </ul>
        <p style={{ fontSize: '14px', backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '6px' }}>
          🤖 AI features are optional and designed to assist, not replace, human decision-making. All AI-generated suggestions 
          require user confirmation before submission.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>12. Children's Privacy</h2>
        <p>
          Our applications are designed for workplace use and are NOT intended for children under 18 years of age. 
          We do not knowingly collect personal information from children. If we become aware that we have collected 
          data from a child, we will take immediate steps to delete such information.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>13. International Data Transfers</h2>
        <p style={{ marginBottom: '10px' }}>
          Our primary servers are located in Indonesia. However, some service providers (AWS, Google) may process data 
          in other countries. When data is transferred internationally, we ensure:
        </p>
        <ul style={{ marginLeft: '25px' }}>
          <li>Adequate data protection safeguards are in place</li>
          <li>Transfer complies with applicable data protection laws</li>
          <li>Service providers maintain equivalent security standards</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>14. Changes to This Privacy Policy</h2>
        <p style={{ marginBottom: '15px' }}>
          We may update this privacy policy from time to time to reflect changes in our practices, technology, legal requirements, 
          or other factors. Changes will be communicated through:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Updating the "Last Updated" date at the top of this policy</li>
          <li>In-app notifications for material changes</li>
          <li>Email notification to registered users (for significant changes)</li>
        </ul>
        <p>
          Continued use of the applications after changes constitutes acceptance of the updated policy. 
          We encourage you to review this policy periodically.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>15. Contact Us</h2>
        <p style={{ marginBottom: '15px' }}>
          If you have questions, concerns, or requests regarding this privacy policy or your personal data, please contact us:
        </p>
        <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '10px', border: '2px solid #d1d5db' }}>
          <p style={{ margin: '8px 0', fontSize: '16px' }}><strong>CV. MAKKURAGA TAMA</strong></p>
          <p style={{ margin: '8px 0' }}>📧 Email: <a href="mailto:ayat.ekapoetra@gmail.com" style={{ color: '#3b82f6' }}>ayat.ekapoetra@gmail.com</a></p>
          <p style={{ margin: '8px 0' }}>🌐 Website: <a href="https://pwa.makkuragatama.id" style={{ color: '#3b82f6' }}>https://pwa.makkuragatama.id</a></p>
          <p style={{ margin: '8px 0' }}>📱 Apps: APPEMPLOYEE (iOS/Android), APP-DRIVER (iOS/Android)</p>
        </div>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>16. Governing Law</h2>
        <p>
          This Privacy Policy is governed by and construed in accordance with the laws of the Republic of Indonesia, 
          including but not limited to Law No. 27 of 2022 on Personal Data Protection (UU PDP). 
          Any disputes arising from this policy will be subject to the exclusive jurisdiction of Indonesian courts.
        </p>
      </section>

      <footer style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
          © 2025 CV. MAKKURAGA TAMA. All rights reserved.
        </p>
        <p style={{ color: '#9ca3af', fontSize: '12px' }}>
          Mining Operations Management System | Employee & Driver Applications
        </p>
      </footer>
    </div>
  )
}
