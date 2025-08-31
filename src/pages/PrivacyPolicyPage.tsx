import React, { useState } from 'react';
import { Shield, Database, Lock, Eye, Clock, Users, Globe, Server, BarChart3, Download, MessageCircle } from 'lucide-react';
import { SecurityAuditService } from '../services/securityAuditService';

const PrivacyPolicyPage: React.FC = () => {
  const [isDownloadingAudit, setIsDownloadingAudit] = useState(false);

  const handleDownloadAudit = async () => {
    try {
      setIsDownloadingAudit(true);
      await SecurityAuditService.downloadAuditReport();
    } catch (error) {
      console.error('Error downloading audit:', error);
      alert('Failed to download audit report. Please try again.');
    } finally {
      setIsDownloadingAudit(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-text mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            How we protect your family's privacy and handle data in the Pack 1703 Families Portal
          </p>
          
          {/* Security Audit Download Button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownloadAudit}
              disabled={isDownloadingAudit}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-soft hover:shadow-glow-green transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingAudit ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Audit...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download Security Audit
                </>
              )}
            </button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="bg-primary/10 rounded-xl p-4 mb-8 text-center">
          <p className="text-text font-medium">
            Last Updated: January 15, 2025
          </p>
        </div>

        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Eye className="w-6 h-6 text-primary mr-3" />
            Overview
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 leading-relaxed mb-4">
              The Pack 1703 Families Portal is designed with your privacy and security as our top priority. 
              This policy explains exactly how we collect, store, protect, and use your information. 
              We believe in complete transparency about our data practices.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Key Principle:</strong> We collect the absolute minimum information necessary to provide 
              you with a great experience, and we never require personal information to use the basic features 
              of our app.
            </p>
          </div>
        </section>

        {/* Data Storage & Infrastructure */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Database className="w-6 h-6 text-secondary mr-3" />
            Where & How We Store Your Data
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3 flex items-center">
                <Server className="w-5 h-5 text-secondary mr-2" />
                Cloud Infrastructure
              </h3>
              <p className="text-gray-600 mb-3">
                Your data is stored securely in the cloud using industry-leading services:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Firebase Firestore:</strong> Our primary database, hosted by Google Cloud Platform</li>
                <li><strong>Google Cloud Platform:</strong> Enterprise-grade security and compliance</li>
                <li><strong>Geographic Location:</strong> Data is stored in Google Cloud data centers in the United States</li>
                <li><strong>Encryption:</strong> All data is encrypted both in transit and at rest</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3 flex items-center">
                <Lock className="w-5 h-5 text-accent mr-2" />
                Security Measures
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Firebase App Check:</strong> Prevents unauthorized access and abuse</li>
                <li><strong>Custom Security Rules:</strong> Firestore rules ensure data can only be accessed as intended</li>
                <li><strong>Rate Limiting:</strong> Prevents spam and abuse through IP-based throttling</li>
                <li><strong>Input Validation:</strong> All data is validated and sanitized before storage</li>
              </ul>
            </div>
          </div>
        </section>

        {/* What Data We Collect */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Users className="w-6 h-6 text-primary mr-3" />
            What Data We Collect
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3">
                Information You Provide (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-text mb-2">RSVP Submissions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Family name (free text)</li>
                    <li>• Number of attendees</li>
                    <li>• Optional email address</li>
                    <li>• Optional phone number</li>
                    <li>• Comments or allergy information</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-text mb-2">Other Submissions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Feedback and questions</li>
                    <li>• Volunteer sign-up information</li>
                    <li>• Bug reports and suggestions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3">
                Information We Collect Automatically
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>IP Address Hash:</strong> We create a unique hash based on your browser information and timestamp for security and rate limiting (we never store your actual IP address)</li>
                <li><strong>User Agent:</strong> Basic browser/device information for security and debugging</li>
                <li><strong>Timestamp:</strong> When you submit information</li>
                <li><strong>Event ID:</strong> Which event you're responding to (if applicable)</li>
                <li><strong>Session ID:</strong> A unique identifier for your current browser session</li>
                <li><strong>User ID:</strong> A randomly generated identifier for chat functionality</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3 flex items-center">
                <MessageCircle className="w-5 h-5 text-primary mr-2" />
                Chat & Messaging Privacy
              </h3>
              <p className="text-gray-600 mb-3">
                Our chat system is designed with privacy in mind, especially for anonymous users:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Anonymous Messaging:</strong> If you post messages while anonymous or not signed in, we cannot trace them back to you individually</li>
                <li><strong>Message Anonymity:</strong> Anonymous messages are indistinguishable from other anonymous messages - we cannot single out specific anonymous users</li>
                <li><strong>Message Retention:</strong> All chat messages are automatically deleted at the end of each scouting year</li>
                <li><strong>No Persistent Storage:</strong> Anonymous chat messages are not stored with any personal identifiers</li>
                <li><strong>Real-time Only:</strong> Anonymous messages exist only during the active session</li>
              </ul>
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> While anonymous messaging provides privacy, please remember to be respectful and follow community guidelines. 
                  Inappropriate content may still be moderated by pack leadership.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3 flex items-center">
                <BarChart3 className="w-5 h-5 text-primary mr-2" />
                Analytics & Usage Data (Privacy-Focused)
              </h3>
              <p className="text-gray-600 mb-3">
                To improve your experience and help pack leadership understand how families use the portal, 
                we collect anonymous usage analytics through Firebase Analytics:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Page Views:</strong> Which pages families visit most often</li>
                <li><strong>Session Duration:</strong> How long families stay engaged with the app</li>
                <li><strong>Feature Usage:</strong> Which features are most popular and which need improvement</li>
                <li><strong>Performance Metrics:</strong> Page load times and error rates to identify issues</li>
                <li><strong>Navigation Patterns:</strong> How families move through the app</li>
                <li><strong>Device Information:</strong> Browser type and device category (no personal identifiers)</li>
                <li><strong>Form Interactions:</strong> How families interact with RSVP forms and other features</li>
                <li><strong>Error Tracking:</strong> Anonymous error reports to improve app stability</li>
              </ul>
              <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
                <p className="text-gray-600 text-sm">
                  <strong>Why This Matters:</strong> This data helps us improve the app experience, 
                  identify where families might need help, optimize performance, and prioritize which 
                  features to develop next. We never collect personal information through analytics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Globe className="w-6 h-6 text-secondary mr-3" />
            How We Use Your Data
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
            <ul className="list-disc list-inside text-gray-600 space-y-3 ml-4">
              <li><strong>Event Management:</strong> Process RSVPs, track attendance, and manage volunteer roles</li>
              <li><strong>Communication:</strong> Respond to feedback and questions</li>
              <li><strong>Security:</strong> Prevent abuse and ensure fair access to our services</li>
              <li><strong>Improvement:</strong> Use anonymous feedback to improve the app experience</li>
              <li><strong>Analytics:</strong> Understand usage patterns to optimize performance and features</li>
              <li><strong>Compliance:</strong> Meet legal obligations and maintain records as required</li>
            </ul>
            <p className="text-gray-600 mt-4">
              <strong>We never sell, rent, or share your personal information with third parties</strong> 
              except as required by law or as described in this policy.
            </p>
          </div>
        </section>

        {/* Data Protection & Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Lock className="w-6 h-6 text-accent mr-3" />
            How We Protect Your Privacy
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3">
                PII Minimization & Anonymization
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Optional Information:</strong> Email and phone are never required</li>
                <li><strong>Data Scrubbing:</strong> We remove unnecessary personal details and normalize data</li>
                <li><strong>IP Hashing:</strong> Your IP address is hashed and salted for security</li>
                <li><strong>Content Filtering:</strong> HTML and potentially harmful content is blocked</li>
                <li><strong>Analytics Anonymization:</strong> All analytics data is completely anonymous</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3">
                Local Storage & Session Management
              </h3>
              <p className="text-gray-600 mb-3">
                To provide a seamless experience, we use your browser's local storage for:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Chat Username:</strong> Your chosen display name for chat functionality</li>
                <li><strong>Session ID:</strong> A unique identifier for your current browser session</li>
                <li><strong>User ID:</strong> A randomly generated identifier for chat features</li>
                <li><strong>Den Selection:</strong> Your chosen den affiliation for chat organization</li>
                <li><strong>Admin Status:</strong> Whether you have administrative access (if applicable)</li>
              </ul>
              <div className="mt-4 p-4 bg-accent/10 rounded-lg">
                <p className="text-gray-600 text-sm">
                  <strong>Important:</strong> This information is stored only on your device and is not shared with our servers 
                  unless you actively use chat features. You can clear this data at any time by clearing your browser's local storage.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-display font-semibold text-text mb-3">
                Access Controls
              </h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li><strong>Public Read-Only:</strong> Event details, locations, and announcements are publicly readable</li>
                <li><strong>Private Fields Hidden:</strong> Sensitive notes and private information are never sent to your device</li>
                <li><strong>Function-Only Writes:</strong> All data submissions go through secure Cloud Functions</li>
                <li><strong>No Direct Database Access:</strong> Your device cannot directly write to our database</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Clock className="w-6 h-6 text-primary mr-3" />
            How Long We Keep Your Data
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-text mb-2">Event-Related Data</h3>
                <p className="text-gray-600">
                  RSVP information and volunteer signups are kept for the duration of the event season 
                  plus one additional year for historical reference and planning purposes.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Feedback & Questions</h3>
                <p className="text-gray-600">
                  General feedback and questions are retained for up to 3 years to help us improve 
                  our services and maintain a record of user interactions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Analytics Data</h3>
                <p className="text-gray-600">
                  Anonymous usage analytics are kept for up to 2 years to help us understand long-term 
                  trends and improve the app experience.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Security Logs</h3>
                <p className="text-gray-600">
                  IP hashes and security-related data are kept for up to 1 year for security 
                  monitoring and abuse prevention.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Local Storage Data</h3>
                <p className="text-gray-600">
                  Chat usernames, session IDs, and user preferences stored in your browser's local storage 
                  persist until you clear your browser data or manually remove them. This data is not stored 
                  on our servers and is only used for your convenience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Users className="w-6 h-6 text-secondary mr-3" />
            Your Rights & Choices
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-text mb-2">Data Access</h3>
                <p className="text-gray-600">
                  You can request a copy of all personal information we have about you and your family.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Data Deletion</h3>
                <p className="text-gray-600">
                  You can request that we delete your personal information at any time.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Data Correction</h3>
                <p className="text-gray-600">
                  You can request corrections to any inaccurate personal information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Opt-Out</h3>
                <p className="text-gray-600">
                  You can choose not to provide optional information like email or phone numbers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Analytics Opt-Out</h3>
                <p className="text-gray-600">
                  You can opt out of anonymous analytics collection (though this helps us improve the app).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">Clear Local Storage</h3>
                <p className="text-gray-600">
                  You can clear your chat username, session data, and other local storage information 
                  at any time through your browser settings or by clearing browser data.
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <p className="text-text font-medium">
                To exercise any of these rights, contact us at: 
                <a href="mailto:cubmaster@sfpack1703.com" className="text-accent hover:text-accent-dark ml-1">
                  cubmaster@sfpack1703.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Shield className="w-6 h-6 text-accent mr-3" />
            Legal Compliance
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-text mb-2">GDPR Compliance</h3>
                <p className="text-gray-600">
                  We comply with the European Union's General Data Protection Regulation (GDPR), 
                  including data subject rights, data minimization, and lawful processing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">CCPA Compliance</h3>
                <p className="text-gray-600">
                  We comply with the California Consumer Privacy Act (CCPA), providing California 
                  residents with specific rights regarding their personal information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-2">COPPA Compliance</h3>
                <p className="text-gray-600">
                  We comply with the Children's Online Privacy Protection Act (COPPA) and do not 
                  knowingly collect personal information from children under 13 without parental consent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Users className="w-6 h-6 text-primary mr-3" />
            Contact Us
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className="space-y-2">
              <p className="text-text">
                <strong>Email:</strong> 
                <a href="mailto:cubmaster@sfpack1703.com" className="text-accent hover:text-accent-dark ml-2">
                  cubmaster@sfpack1703.com
                </a>
              </p>
              <p className="text-text">
                <strong>Pack Leadership:</strong> Available through your den leader or pack committee
              </p>
            </div>
          </div>
        </section>

        {/* Updates to Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-text mb-6 flex items-center">
            <Clock className="w-6 h-6 text-secondary mr-3" />
            Updates to This Policy
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons. We will notify you of any material 
              changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            <p className="text-gray-600 mt-4">
              <strong>Your continued use of the Pack 1703 Families Portal after any changes constitutes 
              acceptance of the updated Privacy Policy.</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
