import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Platform
} from 'react-native';
import { ChevronLeft, Shield, Scale, Info, LifeBuoy, Mail, Phone, Globe, MapPin } from 'lucide-react-native';

const InfoScreen = ({ route, navigation }) => {
    const { type } = route.params;

    const getContent = () => {
        switch (type) {
            case 'about':
                return {
                    title: 'About HomeSarthi',
                    content: [
                        {
                            type: 'paragraph',
                            text: 'HomeSarthi is India\'s fastest growing student housing ecosystem, designed specifically for the modern student. We bridge the gap between students looking for safe, affordable, and high-quality accommodation and property owners seeking reliable tenants.'
                        },
                        {
                            type: 'heading',
                            text: 'Our Mission'
                        },
                        {
                            type: 'paragraph',
                            text: 'To simplify the student living experience by providing transparency, zero brokerage, and verified listings. We believe that finding a home away from home should be as easy as booking a ride.'
                        },
                        {
                            type: 'heading',
                            text: 'What We Offer'
                        },
                        {
                            type: 'bullet',
                            text: '100% Verified Listings manually checked by our team.'
                        },
                        {
                            type: 'bullet',
                            text: 'Zero Brokerage directly connecting students with owners.'
                        },
                        {
                            type: 'bullet',
                            text: 'Proximity mapping to colleges and institutions.'
                        }
                    ]
                };
            case 'privacy':
                return {
                    title: 'Privacy Policy',
                    content: [
                        {
                            type: 'paragraph',
                            text: 'Last Updated: February 21, 2026'
                        },
                        {
                            type: 'heading',
                            text: '1. Information We Collect'
                        },
                        {
                            type: 'paragraph',
                            text: 'We collect personal information (name, email, phone) you provide during registration. We also collect location data to show you nearby rooms and device information to ensure app security.'
                        },
                        {
                            type: 'heading',
                            text: '2. How Data is Shared'
                        },
                        {
                            type: 'paragraph',
                            text: 'We share your contact information only between students and owners to facilitate rental discussions. We use Google Maps for location and Cloudinary for secure image storage.'
                        },
                        {
                            type: 'heading',
                            text: '3. Data Retention'
                        },
                        {
                            type: 'paragraph',
                            text: 'Your data is kept secure in our encrypted database. You can request account deletion at any time by contacting our support team.'
                        },
                        {
                            type: 'heading',
                            text: '4. Safety & Trust'
                        },
                        {
                            type: 'paragraph',
                            text: 'We use your data to prevent fraud and verify the authenticity of room listings on HomeSarthi.'
                        }
                    ]
                };
            case 'terms':
                return {
                    title: 'Terms & Conditions',
                    content: [
                        {
                            type: 'paragraph',
                            text: 'By using HomeSarthi, you agree to these terms.'
                        },
                        {
                            type: 'heading',
                            text: '1. User Obligations'
                        },
                        {
                            type: 'paragraph',
                            text: 'Users must provide accurate information. Misrepresentation of property details by owners or identity by students is strictly prohibited.'
                        },
                        {
                            type: 'heading',
                            text: '2. Platform Role'
                        },
                        {
                            type: 'paragraph',
                            text: 'HomeSarthi is a marketplace platform. While we verify listings, the final rental agreement is between the student and the owner.'
                        },
                        {
                            type: 'heading',
                            text: '3. Prohibited Activities'
                        },
                        {
                            type: 'paragraph',
                            text: 'Users may not use the platform for any illegal activities or to harass other users.'
                        }
                    ]
                };
            case 'safety':
                return {
                    title: 'Safety Guidelines',
                    content: [
                        {
                            type: 'heading',
                            text: 'Student Safety'
                        },
                        {
                            type: 'bullet',
                            text: 'Always visit the property with a friend or family member if possible.'
                        },
                        {
                            type: 'bullet',
                            text: 'Meet property owners in public spaces during daylight hours for initial discussions.'
                        },
                        {
                            type: 'bullet',
                            text: 'Never share sensitive financial info like OTPs or CVVs with anyone claiming to be a HomeSarthi representative.'
                        },
                        {
                            type: 'heading',
                            text: 'Owner Safety'
                        },
                        {
                            type: 'bullet',
                            text: 'Verify the student ID card before finalizing the agreement.'
                        },
                        {
                            type: 'bullet',
                            text: 'Keep a copy of the tenant\'s Aadhar/Government ID for records.'
                        }
                    ]
                };
            case 'contact':
                return {
                    title: 'Contact Us',
                    isContact: true,
                    content: [
                        {
                            type: 'paragraph',
                            text: 'Have questions or need help? Reach out to us through any of the channels below.'
                        }
                    ]
                };
            default:
                return { title: 'Information', content: [] };
        }
    };

    const data = getContent();

    const renderContactInfo = () => (
        <View style={styles.contactContainer}>
            <View style={styles.contactCard}>
                <Mail size={24} color="#2563EB" />
                <View style={styles.contactDetails}>
                    <Text style={styles.contactLabel}>Email Support</Text>
                    <Text style={styles.contactValue}>homesarthi247@gmail.com</Text>
                </View>
            </View>
            <View style={styles.contactCard}>
                <Phone size={24} color="#2563EB" />
                <View style={styles.contactDetails}>
                    <Text style={styles.contactLabel}>Customer Care</Text>
                    <Text style={styles.contactValue}>+91 7880717527 </Text>
                </View>
            </View>
            <View style={styles.contactCard}>
                <Globe size={24} color="#2563EB" />
                <View style={styles.contactDetails}>
                    <Text style={styles.contactLabel}>Website</Text>
                    <Text style={styles.contactValue}>www.homesarthi.in</Text>
                </View>
            </View>
            <View style={styles.contactCard}>
                <MapPin size={24} color="#2563EB" />
                <View style={styles.contactDetails}>
                    <Text style={styles.contactLabel}>Office Address</Text>
                    <Text style={styles.contactValue}> Gorakhnath Gorakhpur Uttar Pradesh 273015</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{data.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {data.content.map((item, index) => {
                    if (item.type === 'heading') {
                        return <Text key={index} style={styles.heading}>{item.text}</Text>;
                    } else if (item.type === 'bullet') {
                        return (
                            <View key={index} style={styles.bulletRow}>
                                <View style={styles.dot} />
                                <Text style={styles.bulletText}>{item.text}</Text>
                            </View>
                        );
                    } else {
                        return <Text key={index} style={styles.paragraph}>{item.text}</Text>;
                    }
                })}

                {data.isContact && renderContactInfo()}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    heading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 24,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
        marginBottom: 16,
    },
    bulletRow: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingLeft: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2563EB',
        marginTop: 9,
        marginRight: 10,
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    contactContainer: {
        marginTop: 20,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    contactDetails: {
        marginLeft: 16,
    },
    contactLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
    }
});

export default InfoScreen;
