import React from 'react';
import { Shield, Users, Lock, Eye, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to Pack 1703 Portal. Please read these terms carefully before using our services.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-blue-600" />
                1. Introduction
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  These Terms of Service ("Terms") govern your use of the Pack 1703 Portal ("Service") 
                  operated by Pack 1703 ("us", "we", or "our"). By accessing or using our Service, 
                  you agree to be bound by these Terms.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Pack 1703 Portal is a digital platform designed to facilitate communication, 
                  event management, and community engagement for Pack 1703 Scout families, 
                  volunteers, and administrators.
                </p>
              </div>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                2. Acceptance of Terms
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  By creating an account, logging in, or using any part of our Service, you 
                  acknowledge that you have read, understood, and agree to be bound by these Terms.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  If you do not agree to these Terms, please do not use our Service.
                </p>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-purple-600" />
                3. User Accounts
              </h2>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Account Creation</h3>
                <p className="text-gray-700 leading-relaxed">
                  To access certain features of our Service, you must create an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">3.2 Account Approval</h3>
                <p className="text-gray-700 leading-relaxed">
                  All new accounts require approval from Pack 1703 administrators. We reserve the 
                  right to approve or deny accounts at our discretion to maintain the security 
                  and integrity of our community.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">3.3 Account Termination</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account immediately, without prior notice, 
                  for conduct that we believe violates these Terms or is harmful to other users, 
                  us, or third parties.
                </p>
              </div>
            </section>

            {/* Privacy and Data Protection */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-indigo-600" />
                4. Privacy and Data Protection
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. Our Privacy Policy explains how we collect, 
                  use, and protect your information when you use our Service.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  By using our Service, you consent to the collection and use of information 
                  in accordance with our Privacy Policy.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">4.1 Children's Privacy</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our Service is designed for Scout families and may include information about 
                  children under 13. We comply with the Children's Online Privacy Protection 
                  Act (COPPA) and require parental consent for any child-related data collection.
                </p>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-yellow-600" />
                5. Acceptable Use
              </h2>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">5.1 Permitted Uses</h3>
                <p className="text-gray-700 leading-relaxed">
                  You may use our Service for lawful purposes related to Pack 1703 activities, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Communicating with other Pack 1703 members</li>
                  <li>Registering for events and activities</li>
                  <li>Accessing educational resources</li>
                  <li>Participating in community discussions</li>
                  <li>Managing your family's Scout information</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">5.2 Prohibited Uses</h3>
                <p className="text-gray-700 leading-relaxed">
                  You agree not to use our Service for any unlawful purpose or in any way that 
                  could damage, disable, overburden, or impair our Service. Prohibited activities include:
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Harassment, bullying, or intimidation of other users</li>
                  <li>Sharing inappropriate, offensive, or harmful content</li>
                  <li>Attempting to gain unauthorized access to accounts or systems</li>
                  <li>Violating any applicable laws or regulations</li>
                  <li>Commercial use without permission</li>
                  <li>Spamming or sending unsolicited communications</li>
                </ul>
              </div>
            </section>

            {/* Content and Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-3 text-red-600" />
                6. Content and Intellectual Property
              </h2>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">6.1 Your Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of content you post to our Service. By posting content, 
                  you grant us a non-exclusive, royalty-free license to use, display, and 
                  distribute your content in connection with our Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">6.2 Our Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  The Service and its original content, features, and functionality are owned 
                  by Pack 1703 and are protected by international copyright, trademark, patent, 
                  trade secret, and other intellectual property laws.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">6.3 Scout-Owned Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  Content created by Scouts (including artwork, photos, and written materials) 
                  remains the property of the individual Scout and their family. We respect 
                  intellectual property rights and will not use Scout-created content without 
                  appropriate permission.
                </p>
              </div>
            </section>

            {/* Disclaimers and Limitations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-orange-600" />
                7. Disclaimers and Limitations
              </h2>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">7.1 Service Availability</h3>
                <p className="text-gray-700 leading-relaxed">
                  We strive to maintain continuous service availability, but we cannot guarantee 
                  uninterrupted access. The Service may be temporarily unavailable due to 
                  maintenance, updates, or technical issues.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">7.2 Limitation of Liability</h3>
                <p className="text-gray-700 leading-relaxed">
                  To the maximum extent permitted by law, Pack 1703 shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages resulting 
                  from your use of the Service.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">7.3 Third-Party Services</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our Service may integrate with third-party services. We are not responsible 
                  for the content, privacy policies, or practices of these third-party services.
                </p>
              </div>
            </section>

            {/* Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-blue-600" />
                8. Modifications
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify or replace these Terms at any time. If a 
                  revision is material, we will try to provide at least 30 days notice prior 
                  to any new terms taking effect.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Your continued use of the Service after any such changes constitutes your 
                  acceptance of the new Terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-green-600" />
                9. Contact Information
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-gray-700">
                    <strong>Pack 1703</strong><br />
                    Email: cubmaster@sfpack1703.com<br />
                    Website: sfpack1703.com
                  </p>
                </div>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-blue-600" />
                10. Governing Law
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  These Terms shall be interpreted and governed by the laws of the State of 
                  California, without regard to its conflict of law provisions.
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Any disputes arising from these Terms or your use of the Service shall be 
                  resolved in the courts of California.
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            By using Pack 1703 Portal, you agree to these Terms of Service.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Pack 1703 Portal - Building character, citizenship, and fitness in our community
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
