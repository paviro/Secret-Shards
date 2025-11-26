'use client';

import { isLegalPagesEnabled } from '@/lib/config';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EnvelopeIcon, PhoneIcon, BeakerIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function LegalDisclosure() {
    if (!isLegalPagesEnabled()) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 overflow-visible">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2 pb-2">
                        Legal Disclosure
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 to-indigo-500 mx-auto rounded-full"></div>
                </div>

                {/* Contact Information Card */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                            <EnvelopeIcon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-200">Contact Information</h2>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-6">Paul-Vincent Roll</h3>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Address */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Address</h4>
                                <div className="text-slate-300 space-y-1">
                                    <p>Gürtelstraße 13</p>
                                    <p>13088 Berlin</p>
                                    <p>Germany</p>
                                </div>
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Contact</h4>
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
                    </div>
                </div>

                {/* Important Disclaimers Card */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center border border-amber-500/30">
                            <BeakerIcon className="w-6 h-6 text-amber-400" stroke="currentColor" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-200">Important</h2>
                    </div>

                    <div className="bg-gradient-to-br from-amber-900/30 to-red-900/30 rounded-2xl p-8 border border-amber-500/30 backdrop-blur-sm shadow-xl space-y-6">

                        {/* No Warranty */}
                        <div>
                            <h3 className="text-lg font-semibold text-amber-400 mb-3">No Warranty</h3>
                            <p className="text-slate-300 leading-relaxed">
                                This website was built by a hobbyist for personal use and is not a professional service created by cryptographic experts.
                                It is provided "as is" without any warranties, express or implied.
                                Use it at your own risk and ensure it meets your security requirements.
                            </p>
                        </div>

                    </div>
                </div>

                {/* Disclaimer Card */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                            <ExclamationTriangleIcon className="w-7 h-7 text-indigo-400" strokeWidth={1.8} />
                        </div>
                        <h2 className="text-2xl font-semibold text-slate-200">Disclaimer</h2>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl space-y-8">
                        {/* Accountability for content */}
                        <div>
                            <h3 className="text-lg font-semibold text-indigo-400 mb-4">Accountability for content</h3>
                            <p className="text-slate-300 leading-relaxed">
                                The contents of our pages have been created with the utmost care. However, we cannot guarantee the contents' accuracy, completeness or topicality. According to statutory provisions, we are furthermore responsible for our own content on these web pages. In this matter, please note that we are not obliged to monitor the transmitted or saved information of third parties, or investigate circumstances pointing to illegal activity. Our obligations to remove or block the use of information under generally applicable laws remain unaffected by this as per §§ 8 to 10 of the Telemedia Act (TMG).
                            </p>
                        </div>

                        {/* Accountability for links */}
                        <div>
                            <h3 className="text-lg font-semibold text-indigo-400 mb-4">Accountability for links</h3>
                            <p className="text-slate-300 leading-relaxed">
                                Responsibility for the content of external links (to web pages of third parties) lies solely with the operators of the linked pages. No violations were evident to us at the time of linking. Should any legal infringement become known to us, we will remove the respective link immediately.
                            </p>
                        </div>

                        {/* Opposition to promotional emails */}
                        <div>
                            <h3 className="text-lg font-semibold text-indigo-400 mb-4">Opposition to promotional emails</h3>
                            <p className="text-slate-300 leading-relaxed">
                                We hereby expressly prohibit the use of contact data published in the context of website legal disclosure requirements with regard to sending promotional and informational materials not expressly requested. The website operator reserves the right to take specific legal action if unsolicited advertising material, such as email spam, is received.
                            </p>
                        </div>

                        {/* Source attribution */}
                        <div className="pt-4 border-t border-slate-700/50">
                            <p className="text-sm text-slate-500 italic">
                                Source: Übersetzungsdienst translate-24h.de
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back link */}
                <div className="text-center mt-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" />
                        Back to Secret Shards
                    </Link>
                </div>
            </div>
        </main>
    );
}
