export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-slate-800 mb-4">404</h1>
                <p className="text-slate-600 mb-6">This link doesn&apos;t exist or has been removed.</p>
                <a href="/" className="text-blue-500 hover:underline">Go to LinkLens</a>
            </div>
        </div>
    );
}
