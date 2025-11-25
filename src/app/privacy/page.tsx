'use client';

import { isLegalPagesEnabled } from '@/lib/config';
import { notFound } from 'next/navigation';
import { CheckIcon, ShieldCheckIcon, DocumentTextIcon, EnvelopeIcon, PhoneIcon, ArrowLeftIcon, QrCodeIcon, LockClosedIcon, ServerStackIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function PrivacyPolicy() {
    if (!isLegalPagesEnabled()) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 px-4 md:px-8 py-4 md:py-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 overflow-visible">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2 pb-2">
                        Privacy Policy
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 to-indigo-500 mx-auto rounded-full"></div>
                </div>

                {/* Core Privacy Principles */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                            <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-200">Core privacy principles</h2>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
                        <p className="text-slate-300 leading-relaxed mb-8">
                            The Secret Shards website was designed with privacy at its core. Unlike with most web services these days, your personal data stays completely private.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* 100% Local Processing */}
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-200">100% Local Processing</h3>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    All data is processed entirely within your browser. Nothing about your secrets is ever transmitted to any servers.
                                </p>
                            </div>

                            {/* No data collection without consent */}
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-200">No personal data collection</h3>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    The website does not collect or transmit any personal data or any other tracking data. Your secrets remain entirely under your control at all times.
                                </p>
                            </div>
                        </div>

                        {/* Browser Extension Warning */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-amber-400 mb-3">Browser Extension Warning</h4>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                Be cautious when using browser extensions (password managers, form fillers, translation tools, etc.) as they may have access to read data from text fields and could potentially leak your secrets. For maximum security, consider using a private/incognito window and disabling extensions when working with sensitive data.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Encryption Details */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30">
                            <ShieldCheckIcon className="w-6 h-6 text-emerald-300" />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-200">How is the data encrypted?</h2>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl p-8 border border-slate-700/40 backdrop-blur-sm shadow-xl space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-100 mb-2">Plain-language explanation</h3>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                To encrypt your messages and files, your browser generates a strong random secret key. That key and your data is then processed and encrypted locally on your device.
                            </p>
                            <p className="text-slate-300 pt-3 leading-relaxed text-sm">
                                After the encryption, the secret key is split into several "puzzle pieces." Each person or location you choose gets one piece. Only when enough pieces are put back together can the secret key be rebuilt and the data unlocked. Without those pieces, all anyone sees is meaningless gibberish.
                            </p>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-700/40 rounded-xl p-6 text-xs text-slate-200 leading-relaxed space-y-3">
                            <p className="font-semibold text-cyan-300 uppercase tracking-wide text-[0.7rem]">Technical specifics</p>
                            <ul className="list-disc list-inside space-y-2 text-slate-300">
                                <li>Key generation and encryption of the data is handled via the Web Crypto API (AES-GCM, 256-bit)</li>
                                <li>Key splitting is performed using Shamir’s Secret Sharing (GF(2^8)) via the <a href="https://www.npmjs.com/package/shamir-secret-sharing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors underline">shamir-secret-sharing</a> library.</li>
                                <li>The Shamir implementation in the library is independently audited, with reports available from <a href="https://cure53.de/audit-report_privy-sss-library.pdf" target="_blank" className="underline">Cure53</a> and <a href="https://github.com/Zellic/publications/blob/master/Privy_Shamir_Secret_Sharing_-_Zellic_Audit_Report.pdf" target="_blank" className="underline">Zellic</a>.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Geocaching Scanner Mode */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                            <QrCodeIcon className="w-6 h-6 text-purple-400" stroke="currentColor" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-200">Scanner Mode</h2>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-2xl p-8 border border-slate-700/40 backdrop-blur-sm shadow-xl">
                        <p className="text-slate-300 leading-relaxed mb-6">
                            The Scanner Mode is a special feature designed for treasure hunts and physical scavenger games. Using your device's camera, you can scan QR codes placed at different locations to collect secret shares. Once you've gathered enough shares from various physical spots, the original secret can be reconstructed and revealed.
                        </p>

                        <div className="space-y-4">
                            <div className="bg-slate-900/30 rounded-xl p-5 border border-slate-700/20">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                        <LockClosedIcon className="w-5 h-5 text-cyan-400" stroke="currentColor" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base font-semibold text-slate-200 mb-2">Local storage only</h4>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-3">
                                            The Geocache Scanner feature uses your browser's local storage to persist scanned shares and data chunks across browser sessions. This allows you to:
                                        </p>

                                        <ul className="list-disc list-inside text-slate-400 text-sm space-y-2 ml-4 mb-3">
                                            <li>Close your browser and return later without losing progress</li>
                                            <li>Move between physical locations while collecting secret shares</li>
                                            <li>Keep your scanned data until you explicitly clear it</li>
                                        </ul>

                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                <strong className="text-blue-400">Important:</strong> All data remains on your device. Nothing is transmitted to any server. Clearing your browser data or starting a new session will delete stored geocache sessions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legal Requirements */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                            <DocumentTextIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-200">Legal Requirements</h2>
                    </div>

                    <div className="space-y-6">
                        {/* 1. General information */}
                        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl p-6 border border-slate-700/30 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-4">1. General information and mandatory information</h3>

                            <h4 className="text-base font-semibold text-slate-300 mb-4">Data Controller Information</h4>

                            <div className="grid md:grid-cols-2 gap-6 bg-slate-900/30 rounded-xl p-6 border border-slate-700/20 mb-4">
                                {/* Address */}
                                <div>
                                    <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Address</h5>
                                    <div className="text-slate-300 space-y-1">
                                        <p className="font-medium">Paul-Vincent Roll</p>
                                        <p>Gürtelstraße 13</p>
                                        <p>13088 Berlin</p>
                                        <p>Germany</p>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div>
                                    <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Contact</h5>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <PhoneIcon className="w-4 h-4 text-cyan-400" />
                                            <a href="tel:+491731626294" className="hover:text-cyan-400 transition-colors">
                                                +49 173 1626294
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <EnvelopeIcon className="w-4 h-4 text-cyan-400" />
                                            <a href="mailto:secret-shards@paviro.de" className="hover:text-cyan-400 transition-colors">
                                                secret-shards@paviro.de
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm leading-relaxed">
                                The responsible party is the natural or legal person who alone or jointly with others decides on the purposes and means of processing personal data.
                            </p>
                        </div>

                        {/* 2. Data collection */}
                        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl p-6 border border-slate-700/30 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-4">2. Data collection</h3>

                            <h4 className="text-base font-semibold text-slate-300 mb-4">2.1. Server log files</h4>
                            <p className="text-slate-300 leading-relaxed text-sm mb-4">
                                When you access the website, certain technical data is automatically collected and stored in server log files. This helps ensure the security, stability, and proper functioning of the service.
                            </p>

                            <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/20 mb-4">
                                <h5 className="font-semibold text-slate-200 text-sm mb-3">These log files include:</h5>
                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <ul className="list-disc list-inside text-slate-400 space-y-2">
                                        <li>IP address of the device making the request</li>
                                        <li>Host name of the requesting device</li>
                                        <li>Timestamp and duration of the request</li>
                                        <li>Request line indicating the requested resource</li>
                                    </ul>
                                    <ul className="list-disc list-inside text-slate-400 space-y-2">
                                        <li>HTTP status code returned by the server</li>
                                        <li>Amount of data transmitted during the request</li>
                                        <li>User agent string (including browser type and version, operating system)</li>
                                        <li>Referrer URL (the webpage that linked to the resource)</li>
                                    </ul>
                                </div>
                            </div>

                            <p className="text-slate-300 leading-relaxed text-sm mb-4">
                                This data may also be used to detect and prevent malicious activity, such as abuse or unauthorized access attempts, including implementing rate limiting on IP addresses to protect the service from overload or attacks.
                            </p>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    The processing of this data is based on Article 6(1)(f) GDPR (legitimate interests), aimed at ensuring service security, stability, and abuse prevention.
                                </p>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    Log files are retained for a maximum of fourteen (14) days and are not linked with any other personal data.
                                </p>
                            </div>
                        </div>

                        {/* 3. Data Processing by Third-Party Providers */}
                        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl p-6 border border-slate-700/30 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-4">3. Data Processing by Third-Party Providers</h3>

                            <div className="bg-slate-900/30 rounded-xl p-5 border border-slate-700/20">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <ServerStackIcon className="w-5 h-5 text-purple-400" stroke="currentColor" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-semibold text-slate-200 mb-3">phasedrei</h4>

                                        <p className="text-slate-300 text-sm leading-relaxed mb-3 break-words">
                                            This website uses <a href="https://phasedrei.de" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors break-words">phasedrei</a>, Richard-Wagner-Ring 2E, 67227 Frankenthal (Pfalz) as the hosting provider.
                                        </p>

                                        <p className="text-slate-400 text-sm leading-relaxed mb-3 break-words">
                                            The collected data mentioned in Section 2 is processed and stored on servers operated by phasedrei.
                                        </p>

                                        <p className="text-slate-400 text-sm leading-relaxed mb-4 break-words">
                                            A data processing agreement is in place with phasedrei, ensuring full compliance with the strict requirements of German data protection authorities.
                                        </p>

                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-3">
                                            <p className="text-sm text-slate-300 leading-relaxed flex items-start gap-2">
                                                <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" stroke="currentColor" strokeWidth={1.5} />
                                                <span className="break-words">
                                                    The privacy policy of phasedrei can be found at: <a href="https://phasedrei.de/datenschutz/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors underline break-all">https://phasedrei.de/datenschutz/</a>
                                                </span>
                                            </p>
                                        </div>

                                        <p className="text-slate-400 text-sm italic break-words">
                                            The use of phasedrei is based on a legitimate interest (Art. 6 (1)(f) GDPR) in ensuring the secure and reliable hosting of this service.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back link */}
                <div className="text-center mt-12 mb-8">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" />
                        Back to Secret Shards
                    </a>
                </div>
            </div>
        </main>
    );
}
