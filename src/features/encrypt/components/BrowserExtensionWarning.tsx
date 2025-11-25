import Link from 'next/link';
import { EyeIcon } from '@heroicons/react/24/outline';
import ExpandingInfoSection from '@/components/ExpandingInfoSection';

export default function BrowserExtensionWarning() {
    return (
        <ExpandingInfoSection
            variant="warning"
            title="A Word About Browser Extensions"
            icon={<EyeIcon className="w-6 h-6" />}
            description="Browser extensions are awesome but they can also be a security risk."
        >
            {(collapse) => (
                <div className="space-y-4">
                    <p className="text-slate-300 leading-relaxed">
                        We all love browser extensions, whether it's your password manager, form fillers, ad blockers, or any other tool that enhances your browsing experience. Depending on your browser settings, however, these extensions can also pose a security risk by being able to read and modify the content of web pages you visit. While this website performs all encryption locally in your browser, a malicious or compromised extension could potentially access your secrets before they are encrypted.
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                        For the highest level of security, we recommend temporarily disabling extensions or using this tool in an <strong>Incognito</strong> or <strong>Private</strong> window where extensions are typically disabled by default.
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                        <Link
                            href="/privacy"
                            className="text-orange-400 hover:text-orange-300 underline underline-offset-4 transition-colors"
                        >
                            Read Privacy Policy
                        </Link>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                collapse();
                            }}
                            className="text-slate-400 hover:text-slate-200 font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </ExpandingInfoSection>
    );
}
