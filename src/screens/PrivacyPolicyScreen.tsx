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
};

const PrivacyPolicyScreen = () => {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
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
          <Text style={styles.bannerSubtitle}>Privacy Policy</Text>
          <Text style={styles.bannerDate}>Last Updated: November 22, 2025</Text>
        </View>

        {/* Introduction */}
        <SectionHeader title="1. Introduction">
          <Text style={styles.paragraph}>
            Safe Hunt Pro/Safe Hunt, LLC respects all Safe Hunt Pro user's privacy and we will never knowingly sell, provide, or willingly give your information to any other company unless necessary to better support our users. We take privacy seriously, but users must understand that user location and user sharing is a key feature to providing a safer experience outdoors.
          </Text>
          <Text style={styles.paragraph}>
            This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
          </Text>
          <Text style={styles.paragraph}>
            We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.
          </Text>
        </SectionHeader>

        {/* Interpretation and Definitions */}
        <SectionHeader title="2. Interpretation and Definitions">
          <SubSection title="Interpretation">
            <Text style={styles.paragraph}>
              The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
            </Text>
          </SubSection>
          
          <SubSection title="Definitions">
            <BulletPoint text="&quot;Account&quot; means a unique account created for You to access our Service or parts of our Service." />
            <BulletPoint text="&quot;Application&quot; means the software program provided by the Company downloaded by You on any electronic device, named Safe Hunt" />
            <BulletPoint text="&quot;Company&quot; (referred to as either &quot;the Company&quot;, Safe Hunt, &quot;We&quot;, &quot;Us&quot; or &quot;Our&quot; in this Agreement)" />
            <BulletPoint text="&quot;Country&quot; refers to United States" />
            <BulletPoint text="&quot;Cookies&quot; are small files that are placed on Your computer, mobile device or any other device by a website" />
            <BulletPoint text="&quot;Device&quot; means any device that can access the Service such as a computer, a cell phone or a digital tablet" />
            <BulletPoint text="&quot;Personal Data&quot; is any information that relates to an identified or identifiable individual" />
            <BulletPoint text="&quot;Service&quot; refers to the Website" />
            <BulletPoint text="&quot;Service Provider&quot; means any natural or legal person who processes the data on behalf of the Company" />
            <BulletPoint text="&quot;Usage Data&quot; refers to data collected automatically" />
            <BulletPoint text="&quot;You&quot; means the individual accessing or using the Service" />
          </SubSection>
        </SectionHeader>

        {/* Collecting and Using Your Personal Data */}
        <SectionHeader title="3. Collecting and Using Your Personal Data">
          <SubSection title="Types of Data Collected">
            <Text style={styles.subSectionTitle}>Personal Data</Text>
            <Text style={styles.paragraph}>
              While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
            </Text>
            <BulletPoint text="Email address" />
            <BulletPoint text="First name and last name" />
            <BulletPoint text="Phone number" />
            <BulletPoint text="Address, State, Province, ZIP/Postal code, City" />
            <BulletPoint text="Usage Data" />
          </SubSection>

          <SubSection title="Usage Data">
            <Text style={styles.paragraph}>
              Usage Data is collected automatically when using the Service. Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
            </Text>
          </SubSection>

          <SubSection title="Information Collected while Using the Application">
            <Text style={styles.paragraph}>
              While using Our Application, in order to provide features of Our Application, We may collect, with Your prior permission: Information regarding your location.
            </Text>
            <Text style={styles.paragraph}>
              We use this information to pinpoint location to allow location sharing to another user. No personal information is automatically provided to another user unless provided by that user either directly or indirectly.
            </Text>
          </SubSection>
        </SectionHeader>

        {/* Location Sharing and Safety */}
        <SectionHeader title="4. Location Sharing and Safety">
          <BulletPoint text="User's agree while utilizing Safe Hunt Pro, they will allow the app to utilize and share their location with other users for the purpose of safety and experience" />
          <BulletPoint text="The user sharing feature is strictly for Safe Hunt Pro users and will not be shared outside of the Safe Hunt Pro application (exceptions provided below)" />
          <BulletPoint text="The user sharing will be limited to a map radius of .5 miles. Any user outside of this radius on the map will not be visible" />
          <BulletPoint text="User location will be available any time a user is utilizing the map feature in Safe Hunt Pro" />
          <BulletPoint text="If it has been determined that a user is engaging in criminal activity, terms and conditions have been voided and user location can be utilized and shared with external agencies to help prevent further criminal activity" />
          <BulletPoint text="If it has been determined that a user is in danger and needs emergency assistance, special circumstances can be enacted to partner with external agencies (example: law enforcement and/or emergency services) to help locate specified user" />
          <BulletPoint text="Safe Hunt Pro users understand and accept any and all responsibility for the use of this application. Each user waives their right to sue unless gross negligence has been proven" />
        </SectionHeader>

        {/* Use of Your Personal Data */}
        <SectionHeader title="5. Use of Your Personal Data">
          <Text style={styles.paragraph}>
            The Company may use Personal Data for the following purposes:
          </Text>
          <BulletPoint text="To provide and maintain our Service, including to monitor the usage of our Service" />
          <BulletPoint text="To manage Your Account: to manage Your registration as a user of the Service" />
          <BulletPoint text="For the performance of a contract" />
          <BulletPoint text="To contact You: by email, telephone calls, SMS, or other equivalent forms of electronic communication" />
          <BulletPoint text="To provide You with news, special offers and general information" />
          <BulletPoint text="To manage Your requests" />
          <BulletPoint text="For business transfers" />
          <BulletPoint text="For other purposes: such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns" />
        </SectionHeader>

        {/* Retention and Transfer of Data */}
        <SectionHeader title="6. Retention and Transfer of Your Personal Data">
          <Text style={styles.paragraph}>
            The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.
          </Text>
          <Text style={styles.paragraph}>
            Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.
          </Text>
        </SectionHeader>

        {/* Disclosure of Your Personal Data */}
        <SectionHeader title="7. Disclosure of Your Personal Data">
          <SubSection title="Business Transactions">
            <Text style={styles.paragraph}>
              If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.
            </Text>
          </SubSection>
          
          <SubSection title="Law Enforcement">
            <Text style={styles.paragraph}>
              Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).
            </Text>
          </SubSection>
        </SectionHeader>

        {/* Login Options */}
        <SectionHeader title="8. Login Options">
          <Text style={styles.paragraph}>
            SafeHuntPro user id and password creation:
          </Text>
          <BulletPoint text="Apple – we will allow user to pair their login with their apple sign in information" />
          <BulletPoint text="G-Mail – we will allow user to pair their login with their G-Mail sign in information" />
          <BulletPoint text="Facebook/Meta – we will allow user to pair their login with their Facebook/Meta sign in information" />
          <Text style={styles.paragraph}>
            If you choose a login through Apple, G-Mail, or Facebook/Meta you are agreeing to allow those entities to have access to some pieces of your information needed during the use of our application.
          </Text>
        </SectionHeader>

        {/* Security and Children's Privacy */}
        <SectionHeader title="9. Security and Children's Privacy">
          <Text style={styles.paragraph}>
            The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.
          </Text>
          <Text style={styles.paragraph}>
            Our Service does not address anyone under the age of 18. We do not knowingly collect personally identifiable information from anyone under the age of 18. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us.
          </Text>
        </SectionHeader>

        {/* Links to Other Websites and Changes */}
        <SectionHeader title="10. Links to Other Websites and Changes">
          <Text style={styles.paragraph}>
            Our Service may contain links to other websites that are not operated by Us. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
          </Text>
          <Text style={styles.paragraph}>
            We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </Text>
        </SectionHeader>

        {/* Contact Us */}
        <SectionHeader title="11. Contact Us">
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, You can contact us:
          </Text>
          <BulletPoint text="By visiting this page on our website: www.safehunt.app" />
          <BulletPoint text="By sending us an email: Safehunt1@gmail.com" />
        </SectionHeader>

        {/* Final Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Stay connected. Stay safe. Stay unstoppable.
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => navigation.navigate('TermsConditions')}>
              <Text style={styles.footerLinkText}>Terms &amp; Conditions</Text>
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
    backgroundColor: '#FCFAF0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  headerContainer: { height: 260, position: 'relative' },
  coverImage: { width: '100%', height: 215, resizeMode: 'cover' },
  header: {
    backgroundColor: '#0E713E',
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 0 : 75,
    paddingBottom: 15,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between'
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 15,
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
    fontSize: 18,
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

export default PrivacyPolicyScreen;