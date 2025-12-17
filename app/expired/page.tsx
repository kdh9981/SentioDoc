import Link from 'next/link';

export default function ExpiredPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">⏰</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h1>
                <p className="text-slate-600 mb-6">
                    This link is no longer available. The owner has set an expiration date that has passed.
                </p>
                <p className="text-sm text-slate-500 mb-6">
                    If you believe this is an error, please contact the person who shared this link with you.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Go to LinkLens
                </Link>
            </div>
        </div>
    );
}
