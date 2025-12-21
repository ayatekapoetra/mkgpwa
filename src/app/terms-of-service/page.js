export const metadata = {
  title: 'Terms of Service - MKG Mobile Apps',
  description: 'Terms of Service for APPEMPLOYEE and APP-DRIVER Mobile Applications'
}

export default function TermsOfServicePage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>Terms of Service</h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>Last Updated: December 11, 2025</p>

      <div style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '8px', marginBottom: '30px', borderLeft: '4px solid #3b82f6' }}>
        <p style={{ margin: 0, fontWeight: '500' }}>
          These Terms of Service apply to both <strong>APPEMPLOYEE</strong> (Employee Management App) and <strong>APP-DRIVER</strong> (Operator & Driver App), 
          collectively referred to as "our applications" or "the apps".
        </p>
      </div>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>1. Acceptance of Terms</h2>
        <p style={{ marginBottom: '15px' }}>
          By accessing and using MKG Mobile Applications operated by CV. MAKKURAGA TAMA ("we," "our," or "us"), 
          you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, 
          please do not use our applications.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you (the "User") and CV. MAKKURAGA TAMA 
          regarding your use of the applications for mining operations management.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>2. Applications and Services</h2>
        
        <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>📱 APPEMPLOYEE</h3>
          <p style={{ margin: 0, marginBottom: '10px' }}>
            Employee management application for general staff, supervisors, managers, and HRD personnel.
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: 0, fontSize: '14px' }}>
            <li>Attendance tracking with photo verification</li>
            <li>Job assignments and task management</li>
            <li>Approval workflows (timesheet, purchase requests, fund requests)</li>
            <li>Reporting and analytics</li>
            <li>Profile and settings management</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#dbeafe', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>🚛 APP-DRIVER</h3>
          <p style={{ margin: 0, marginBottom: '10px' }}>
            Operator and driver application for heavy equipment operators and dump truck drivers.
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: 0, fontSize: '14px' }}>
            <li>Offline-first timesheet management with SQLite</li>
            <li>Equipment plan assignments</li>
            <li>Fuel consumption tracking</li>
            <li>AI-assisted data entry (Google Gemini)</li>
            <li>Automatic sync with retry mechanism</li>
          </ul>
        </div>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>3. User Accounts and Authentication</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.1 Account Creation</h3>
        <p style={{ marginBottom: '15px' }}>
          Access to applications is provided through employer-managed accounts. You must:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Be an active employee of CV. MAKKURAGA TAMA or affiliated companies</li>
          <li>Have valid employment credentials provided by HR department</li>
          <li>Use your real identity and accurate information</li>
          <li>Be assigned appropriate role and permissions</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.2 Account Responsibilities</h3>
        <p style={{ marginBottom: '15px' }}>You are responsible for:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Maintaining confidentiality of your username and password</li>
          <li>All activities that occur under your account</li>
          <li>Not sharing your account credentials with others</li>
          <li>Immediately notifying IT/HR of unauthorized access</li>
          <li>Keeping your contact information current</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>3.3 Device Authentication</h3>
        <p style={{ marginBottom: '15px' }}>
          Applications may implement device binding to prevent account sharing. You agree that:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Your account may be linked to specific device IDs</li>
          <li>Multiple devices may require approval from administrators</li>
          <li>Device changes may require verification</li>
          <li>Unauthorized device access may be blocked</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>4. Acceptable Use</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>4.1 Permitted Use</h3>
        <p style={{ marginBottom: '15px' }}>You may use applications for:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Recording work attendance and timesheet data</li>
          <li>Managing job assignments and tasks</li>
          <li>Processing approval workflows</li>
          <li>Viewing operational reports and analytics</li>
          <li>Communicating work-related information</li>
          <li>Accessing company resources and information</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>4.2 Prohibited Activities</h3>
        <p style={{ marginBottom: '15px' }}>You agree NOT to:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Fraudulent Use:</strong> Submit false attendance data, fake timesheets, or inaccurate information</li>
          <li><strong>Unauthorized Access:</strong> Attempt to access other users' accounts or restricted data</li>
          <li><strong>System Abuse:</strong> Overload servers, attempt DDoS attacks, or disrupt service</li>
          <li><strong>Reverse Engineering:</strong> Attempt to extract source code, algorithms, or business logic</li>
          <li><strong>Data Theft:</strong> Extract, copy, or misuse company data</li>
          <li><strong>Account Sharing:</strong> Share login credentials or allow others to use your account</li>
          <li><strong>Location Spoofing:</strong> Use GPS spoofing apps to fake work locations</li>
          <li><strong>Commercial Use:</strong> Use applications for competing business purposes</li>
          <li><strong>Violation of Law:</strong> Use applications for illegal activities</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>5. Location Services and Geofencing</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>5.1 Location Requirements</h3>
        <p style={{ marginBottom: '15px' }}>
          Applications require location services for operational purposes. By using the apps, you consent to:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Collection of precise GPS coordinates during attendance and timesheet activities</li>
          <li>Geofencing validation to ensure you are within authorized work areas</li>
          <li>Location-based attendance verification and reporting</li>
          <li>Storage of location data for operational and compliance purposes</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>5.2 Geofencing Rules</h3>
        <p style={{ marginBottom: '15px' }}>
          Geofencing ensures attendance is recorded at legitimate work locations:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Check-in/out may be restricted to predefined work areas</li>
          <li>Radius limits can be configured per location (e.g., 100 meters)</li>
          <li>Outside geofence attempts may be flagged for review</li>
          <li>Location exceptions require supervisor approval</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>5.3 Location Controls</h3>
        <p style={{ marginBottom: '15px' }}>
          You maintain control over location data:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Location permissions can be controlled through device settings</li>
          <li>Background location tracking is NOT performed</li>
          <li>Location is only collected during active app usage</li>
          <li>You can revoke location permissions (may limit app functionality)</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>6. Data Accuracy and Integrity</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>6.1 Data Entry Responsibilities</h3>
        <p style={{ marginBottom: '15px' }}>You are responsible for:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Accuracy:</strong> Submitting correct and truthful information</li>
          <li><strong>Timeliness:</strong> Recording data promptly when activities occur</li>
          <li><strong>Completeness:</strong> Filling all required fields and information</li>
          <li><strong>Validation:</strong> Reviewing data before submission</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>6.2 Photo Verification</h3>
        <p style={{ marginBottom: '15px' }}>
          Attendance requires photo verification. You agree to:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Take clear, identifiable selfie photos during check-in/out</li>
          <li>Ensure photos are taken at actual work locations</li>
          <li>Not use filters, masks, or other obstructions</li>
          <li>Allow photos to be stored for attendance verification</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>6.3 Data Validation</h3>
        <p style={{ marginBottom: '15px' }}>
          Applications include automated validation. You acknowledge that:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Invalid data may be rejected with explanation</li>
          <li>Unusual patterns may trigger review alerts</li>
          <li>System may suggest corrections for common errors</li>
          <li>Final responsibility for data accuracy remains with you</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>7. Offline Functionality (APP-DRIVER)</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>7.1 Offline Storage</h3>
        <p style={{ marginBottom: '15px' }}>
          APP-DRIVER includes offline capabilities using local SQLite database:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Master data (equipment, locations, activities) downloaded for offline use</li>
          <li>Timesheet data saved locally when internet unavailable</li>
          <li>Automatic sync queue for pending submissions</li>
          <li>Encrypted local storage for data security</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>7.2 Sync Responsibilities</h3>
        <p style={{ marginBottom: '15px' }}>You agree to:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Connect to internet regularly for data synchronization</li>
          <li>Review sync status and resolve failed submissions</li>
          <li>Not use offline mode to avoid data validation</li>
          <li>Ensure device has adequate storage for offline data</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>8. Approval Workflows</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>8.1 Approval Authority</h3>
        <p style={{ marginBottom: '15px' }}>
          Users with approval privileges must:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Review requests promptly and fairly</li>
          <li>Provide clear reasons for rejections</li>
          <li>Follow company approval policies and limits</li>
          <li>Maintain audit trail of all decisions</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>8.2 Request Submission</h3>
        <p style={{ marginBottom: '15px' }}>
          Users submitting requests must:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Provide complete and accurate information</li>
          <li>Include necessary supporting documents</li>
          <li>Follow company request procedures</li>
          <li>Respond to approval queries promptly</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>9. Intellectual Property Rights</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>9.1 Application Ownership</h3>
        <p style={{ marginBottom: '15px' }}>
          The applications and all content, features, and functionality are owned by CV. MAKKURAGA TAMA and protected by:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Copyright laws and international treaties</li>
          <li>Trademark and trade dress laws</li>
          <li>Trade secret and unfair competition laws</li>
          <li>Patent and intellectual property rights</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>9.2 Restrictions</h3>
        <p style={{ marginBottom: '15px' }}>You may NOT:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Copy, modify, or distribute the applications</li>
          <li>Reverse engineer, decompile, or extract source code</li>
          <li>Create derivative works or competing products</li>
          <li>Remove or alter copyright notices or trademarks</li>
          <li>Use applications for commercial hosting services</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>9.3 User-Generated Content</h3>
        <p style={{ marginBottom: '15px' }}>
          You retain ownership of data you submit, but grant us:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>License to use, process, and analyze your data for service provision</li>
          <li>Right to create aggregated, anonymized reports</li>
          <li>Permission to improve services using usage patterns</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>10. Privacy and Data Protection</h2>
        <p style={{ marginBottom: '15px' }}>
          Your use of applications is also governed by our Privacy Policy, which explains:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>What personal information we collect and why</li>
          <li>How we use and share your data</li>
          <li>Security measures we implement</li>
          <li>Your rights regarding your data</li>
          <li>How to contact us about privacy concerns</li>
        </ul>
        <p style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '6px' }}>
          By using our applications, you consent to the collection and use of information as described in our Privacy Policy.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>11. Service Availability and Performance</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>11.1 Service Availability</h3>
        <p style={{ marginBottom: '15px' }}>
          We strive to maintain high service availability but cannot guarantee:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>100% uptime or uninterrupted service</li>
          <li>Error-free operation at all times</li>
         <li>Immediate response during peak usage periods</li>
          <li>Service availability during maintenance windows</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>11.2 Maintenance and Updates</h3>
        <p style={{ marginBottom: '15px' }}>
          We may periodically:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Perform scheduled maintenance (with advance notice when possible)</li>
          <li>Release updates and new features</li>
          <li>Modify or discontinue features</li>
          <li>Change service terms or policies</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>12. Disclaimers and Limitations</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>12.1 Service Disclaimer</h3>
        <p style={{ marginBottom: '15px' }}>
          Applications are provided "as is" and "as available" without warranties of any kind, including:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Implied warranties of merchantability or fitness for particular purpose</li>
          <li>Warranties of non-infringement or title</li>
          <li>Warranties of uninterrupted or error-free operation</li>
          <li>Warranties of data accuracy or completeness</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>12.2 Limitation of Liability</h3>
        <p style={{ marginBottom: '15px' }}>
          To the maximum extent permitted by law, CV. MAKKURAGA TAMA shall not be liable for:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Indirect, incidental, special, or consequential damages</li>
          <li>Lost profits, revenue, or business opportunities</li>
          <li>Data loss or corruption</li>
          <li>Service interruptions or downtime</li>
          <li>Third-party service failures (AWS, Google, etc.)</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>12.3 Data Accuracy</h3>
        <p style={{ marginBottom: '15px' }}>
          While we implement validation and controls, we cannot guarantee:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Complete accuracy of all user-submitted data</li>
          <li>Real-time synchronization across all devices</li>
          <li>Freedom from technical errors or bugs</li>
          <li>Compatibility with all device models and OS versions</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>13. Termination</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>13.1 User Termination</h3>
        <p style={{ marginBottom: '15px' }}>
          You may terminate your use by:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Uninstalling the applications from your devices</li>
          <li>Notifying HR/IT department upon employment termination</li>
          <li>Deleting your account through proper channels</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>13.2 Company Termination</h3>
        <p style={{ marginBottom: '15px' }}>
          We may suspend or terminate your access immediately for:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Breach of these Terms of Service</li>
          <li>Violation of company policies or code of conduct</li>
          <li>Engagement in fraudulent or illegal activities</li>
          <li>Employment termination or contract expiration</li>
          <li>Security concerns or unauthorized access</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>13.3 Effect of Termination</h3>
        <p style={{ marginBottom: '15px' }}>
          Upon termination:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Your right to use applications immediately ceases</li>
          <li>Access to your account and data is revoked</li>
          <li>Offline data may be deleted upon uninstall</li>
          <li>Some data may be retained for legal/compliance requirements</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>14. Artificial Intelligence and Automation</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>14.1 AI Features</h3>
        <p style={{ marginBottom: '15px' }}>
          APP-DRIVER includes AI-powered features:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li><strong>Google Gemini Assistant:</strong> Natural language chat for timesheet assistance</li>
          <li><strong>OCR Processing:</strong> Automatic data extraction from document photos</li>
          <li><strong>Smart Validation:</strong> Rule-based data validation and suggestions</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>14.2 AI Usage Terms</h3>
        <p style={{ marginBottom: '15px' }}>You acknowledge that:</p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>AI features are optional and can be disabled</li>
          <li>AI suggestions require human confirmation before submission</li>
          <li>AI interactions may be processed by third-party services (Google)</li>
          <li>AI is designed to assist, not replace, human judgment</li>
          <li>AI responses may not always be accurate or appropriate</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>15. Compliance and Legal Requirements</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>15.1 Mining Regulations</h3>
        <p style={{ marginBottom: '15px' }}>
          Applications are designed for mining operations compliance:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Attendance tracking for labor law compliance</li>
          <li>Equipment monitoring for safety regulations</li>
          <li>Production reporting for government requirements</li>
          <li>Location tracking for site security and safety</li>
        </ul>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>15.2 Data Protection Laws</h3>
        <p style={{ marginBottom: '15px' }}>
          We comply with applicable data protection laws including:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Indonesian Law No. 27 of 2022 on Personal Data Protection</li>
          <li>General Data Protection Regulation (GDPR) for EU operations</li>
          <li>Industry-specific mining and labor regulations</li>
        </ul>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>16. Changes to Terms</h2>
        <p style={{ marginBottom: '15px' }}>
          We reserve the right to modify these Terms at any time. Changes will be communicated through:
        </p>
        <ul style={{ marginLeft: '25px', marginBottom: '15px' }}>
          <li>Updating the "Last Updated" date at the top of these Terms</li>
          <li>In-app notifications for material changes</li>
          <li>Email announcements to registered users</li>
          <li>Company communications and postings</li>
        </ul>
        <p style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '6px' }}>
          Continued use of applications after changes constitutes acceptance of the modified Terms. 
          If you do not agree to changes, you must stop using the applications.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>17. Governing Law and Dispute Resolution</h2>
        <p style={{ marginBottom: '15px' }}>
          These Terms shall be governed by and construed in accordance with the laws of the Republic of Indonesia, 
          without regard to its conflict of law provisions.
        </p>
        <p style={{ marginBottom: '15px' }}>
          Any disputes arising from or relating to these Terms shall be subject to the exclusive jurisdiction of 
          the competent courts in Indonesia.
        </p>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>18. Contact Information</h2>
        <p style={{ marginBottom: '15px' }}>
          For questions about these Terms of Service, please contact us:
        </p>
        <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '10px', border: '2px solid #d1d5db' }}>
          <p style={{ margin: '8px 0', fontSize: '16px' }}><strong>CV. MAKKURAGA TAMA</strong></p>
          <p style={{ margin: '8px 0' }}>📧 Email: <a href="mailto:ayat.ekapoetra@gmail.com" style={{ color: '#3b82f6' }}>ayat.ekapoetra@gmail.com</a></p>
          <p style={{ margin: '8px 0' }}>🌐 Website: <a href="https://pwa.makkuragatama.id" style={{ color: '#3b82f6' }}>https://pwa.makkuragatama.id</a></p>
          <p style={{ margin: '8px 0' }}>📱 Applications: APPEMPLOYEE & APP-DRIVER</p>
          <p style={{ margin: '8px 0' }}>🏢 Industry: Mining Operations Management</p>
        </div>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '600', marginBottom: '15px', color: '#1f2937' }}>19. General Provisions</h2>
        
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>19.1 Entire Agreement</h3>
        <p style={{ marginBottom: '15px' }}>
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and CV. MAKKURAGA TAMA 
          regarding the applications.
        </p>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>19.2 Severability</h3>
        <p style={{ marginBottom: '15px' }}>
          If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
        </p>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>19.3 Waiver</h3>
        <p style={{ marginBottom: '15px' }}>
          Failure to enforce any provision of these Terms does not constitute a waiver of such provision or our right to enforce it.
        </p>

        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', marginTop: '20px' }}>19.4 Assignment</h3>
        <p style={{ marginBottom: '15px' }}>
          You may not assign or transfer your rights under these Terms without our prior written consent. 
          We may assign these Terms without restriction.
        </p>
      </section>

      <footer style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
          © 2025 CV. MAKKURAGA TAMA. All rights reserved.
        </p>
        <p style={{ color: '#9ca3af', fontSize: '12px' }}>
          Mining Operations Management System | Employee & Driver Applications
        </p>
        <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '5px' }}>
          Last Updated: December 11, 2025
        </p>
      </footer>
    </div>
  )
}
