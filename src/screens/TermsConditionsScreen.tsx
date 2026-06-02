import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ASSETS = {
  iconBack: require('../../assets/back_white.png'),
  iconChevron: require('../../assets/chevron_right.png'),
};

const TermsConditionsScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const SectionHeader = ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );

  const BulletPoint = ({ text }: { text: string }) => (
    <View style={styles.bulletPoint}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );

  const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.subSection}>
      <Text style={styles.subSectionTitle}>{title}</Text>
      <View style={styles.subSectionContent}>{children}</View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0E713E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E713E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={ASSETS.iconBack} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={scrollToTop} style={styles.topButton}>
          <Text style={styles.topButtonText}>Top</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Safe Hunt Pro</Text>
          <Text style={styles.bannerSubtitle}>Terms and Conditions</Text>
          <Text style={styles.bannerDate}>Last Updated: June 1, 2026</Text>
        </View>

        {/* Introduction */}
        <SectionHeader title="1. Introduction">
          <Text style={styles.paragraph}>
            This document governs the use of our application in a legally binding way. You must read this document carefully.
          </Text>
          <Text style={styles.paragraph}>
            Our application is provided by: <Text style={styles.boldText}>Safe Hunt Pro: Mobile Application</Text>
          </Text>
          <Text style={styles.paragraph}>
            Contact email: <Text style={styles.linkText}>Safehunt1@gmail.com</Text>
          </Text>
        </SectionHeader>

        {/* Terms of Use */}
        <SectionHeader title="2. Terms of Use (EULA)">
          <Text style={styles.paragraph}>
            Unless stated otherwise, the terms in this section apply generally when using our application. Specific or additional conditions may apply in certain situations and are noted in this document.
          </Text>
          
          <SubSection title="By using our application, you confirm the following:">
            <BulletPoint text="you are older than 18 years of age" />
            <BulletPoint text="you are not in a country under a U.S. government embargo or designated as a &quot;terrorist-supporting&quot; country" />
            <BulletPoint text="you are not on any U.S. government list of prohibited or restricted parties" />
            <BulletPoint text="you are not utilizing Safe Hunt Pro to engage in any form of criminal activity" />
          </SubSection>
        </SectionHeader>

        {/* Account Registration */}
        <SectionHeader title="3. Account Registration">
          <Text style={styles.paragraph}>
            To use our application, you can register or create an account by providing complete and truthful information.
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for keeping your login details confidential and must choose passwords that meet the highest standards of strength as allowed by our application.
          </Text>
          <Text style={styles.paragraph}>
            By registering, you agree to take full responsibility for all activities under your username and password.
          </Text>
          <Text style={styles.paragraph}>
            You must immediately inform us using the contact details in this document if you believe your personal information, account, or login details have been violated, disclosed, or stolen.
          </Text>
          
          <SubSection title="Conditions for account registration:">
            <BulletPoint text="It is not permitted to register accounts by bots or any other automated methods" />
            <BulletPoint text="You must register only one account, unless otherwise specified" />
            <BulletPoint text="Your account must not be shared with other people unless otherwise specified" />
          </SubSection>
        </SectionHeader>

        {/* Location and Safety */}
        <SectionHeader title="4. Location and Safety">
          <BulletPoint text="If a user registers under the age of 18 by forging birth information, that user along with the guardian take full responsibility for the use of Safe Hunt Pro" />
          <BulletPoint text="Users agree while utilizing Safe Hunt Pro, they will allow the app to utilize and share their location with other users for the purpose of safety and experience" />
          <BulletPoint text="User location sharing is strictly for Safe Hunt Pro users and will not be shared outside of the Safe Hunt Pro application" />
          <BulletPoint text="User sharing will be limited to a map radius of .5 miles. Any user outside of this radius on the map will not be visible" />
          <BulletPoint text="User location will be available any time a user is utilizing the map feature in Safe Hunt Pro" />
        </SectionHeader>

        {/* Emergency and Legal */}
        <SectionHeader title="5. Emergency and Legal Provisions">
          <BulletPoint text="If it has been determined that a user is engaging in criminal activity, terms and conditions have been voided and user location can be utilized and shared with external agencies to help prevent further criminal activity" />
          <BulletPoint text="If it has been determined that a user is in danger and needs emergency assistance, special circumstances can be enacted to partner with external agencies to help locate specified user" />
          <BulletPoint text="Safe Hunt Pro users understand and accept any and all responsibility for the use of this application" />
          <BulletPoint text="Each user waives their right to sue unless gross negligence has been proven" />
        </SectionHeader>

        {/* Content Guidelines */}
        <SectionHeader title="6. Content Guidelines">
          <BulletPoint text="Safe Hunt Pro users agree to follow state specific hunting and outdoor regulations provided by each of their states" />
          <BulletPoint text="Social Media Feed will be visible to all Safe Hunt Pro users" />
          <BulletPoint text="At any time, if a post has been deemed a violation, we reserve the right to remove any and all posts" />
          <BulletPoint text="If continued violations are determined, Safe Hunt Pro reserves the right to block that user from social media capabilities" />
          <BulletPoint text="Safe Hunt Pro is a hunting and outdoor safety and social connection app so be mindful that content will involve outdoor experiences, animals, guns, weapons, and possible hunting images daily" />
        </SectionHeader>

        {/* Account Termination */}
        <SectionHeader title="7. Account Termination">
          <Text style={styles.paragraph}>
            You can close your account and stop using our service anytime by contacting us at the contact details provided in this document.
          </Text>
          <Text style={styles.paragraph}>
            We reserve the right to terminate the Service at any time without notice to you. We may suspend or terminate your use of the Service at any time, with or without cause in our sole discretion.
          </Text>
          
          <SubSection title="Safe Hunt Pro will not tolerate any of the following:">
            <BulletPoint text="Hate Speech towards another user" />
            <BulletPoint text="Threats against another user" />
            <BulletPoint text="Deceiving/Scamming another user" />
            <BulletPoint text="Engaging in any form of illegal or inappropriate activity while utilizing Safe Hunt Pro" />
          </SubSection>
        </SectionHeader>

        {/* Subscriptions and Payments */}
        <SectionHeader title="8. Subscriptions and Payments">
          <Text style={styles.paragraph}>
            User subscriptions will be billed monthly. If payment is not received on set billing cycle, the user subscription may be paused, suspended, and/or deleted.
          </Text>
          <Text style={styles.paragraph}>
            Subscriptions may be terminated at any time. If subscription has already been billed for that month there will be no refund provided to the customer.
          </Text>
        </SectionHeader>

        {/* Liability and Indemnification */}
        <SectionHeader title="9. Liability and Indemnification">
          <Text style={styles.paragraph}>
            We limit our liability as much as legally allowed. Our application is provided on an &quot;as is&quot; and &quot;as available&quot; basis. When you use our application, you are doing so at your own risk.
          </Text>
          <Text style={styles.paragraph}>
            You agree to indemnify us and our affiliates, officers, directors, and employees from any claims or demands made by third parties due to or in connection with any culpable violation of these terms.
          </Text>
        </SectionHeader>

        {/* Disclaimer of Warranties */}
        <SectionHeader title="10. Disclaimer of Warranties">
          <Text style={styles.paragraph}>
            To the maximum extent permitted by applicable law, in no event shall we, along with our subsidiaries, affiliates, officers, directors, agents, partners, suppliers, or employees, be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages arising from or related to your use of, or inability to use, the service.
          </Text>
          <Text style={styles.paragraph}>
            This includes damages for loss of profits, goodwill, use, data, or other intangible losses.
          </Text>
        </SectionHeader>

        {/* Intellectual Property */}
        <SectionHeader title="11. Intellectual Property Rights">
          <Text style={styles.paragraph}>
            All intellectual property rights associated with our application, including copyrights, trademark rights, patent rights, and design rights, are exclusively owned by us or our licensors.
          </Text>
          <Text style={styles.paragraph}>
            All trademarks, trade names, service marks, word marks, illustrations, images, or logos associated with our application, are and remain the exclusive property of us or our licensors.
          </Text>
        </SectionHeader>

        {/* Changes to Terms */}
        <SectionHeader title="12. Changes to Terms">
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time, informing you of any changes. Your continued use of the service will signify your acceptance of the revised terms.
          </Text>
        </SectionHeader>

        {/* Governing Law */}
        <SectionHeader title="13. Governing Law">
          <Text style={styles.paragraph}>
            These terms are governed by the law of the place where we are based, without regard to conflict of laws principles.
          </Text>
        </SectionHeader>

        {/* Contact Information */}
        <SectionHeader title="14. Contact Information">
          <Text style={styles.paragraph}>
            All communication regarding the use of our application must be sent using the contact information provided in this document.
          </Text>
          <Text style={styles.paragraph}>
            Email: <Text style={styles.linkText}>Safehunt1@gmail.com</Text>
          </Text>
        </SectionHeader>

        {/* Final Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Stay connected. Stay safe. Stay unstoppable.
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('TermsConditions')}>
              <Text style={styles.footerLinkText}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>|</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={styles.footerLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.copyrightText}>
            © 2026 Safe Hunt. All rights reserved.
          </Text>
          <Text style={styles.designedText}>
            Designed &amp; Developed by District021
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 60,
    backgroundColor: '#0E713E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
    tintColor: '#FFF',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  topButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderRadius: 20,
  },
  topButtonText: {
    color: '#0E713E',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#0E713E',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerSubtitle: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 8,
  },
  bannerDate: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0E713E',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  sectionContent: {
    paddingLeft: 18,
  },
  subSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subSectionContent: {
    paddingLeft: 12,
  },
  paragraph: {
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0E713E',
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000',
  },
  linkText: {
    color: '#0E713E',
    textDecorationLine: 'underline',
  },
  footerNote: {
    backgroundColor: '#FFF',
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0E713E',
    marginBottom: 15,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  footerLinkText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  footerSeparator: {
    fontSize: 12,
    color: '#CCC',
  },
  copyrightText: {
    fontSize: 11,
    color: '#999',
    marginTop: 10,
  },
  designedText: {
    fontSize: 10,
    color: '#BBB',
    marginTop: 5,
  },
});

export default TermsConditionsScreen;