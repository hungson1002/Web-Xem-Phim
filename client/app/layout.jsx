import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = {
    title: 'PhimHay - Xem phim online chất lượng cao',
    description: 'Xem phim online miễn phí, chất lượng Full HD, cập nhật nhanh nhất',
    keywords: 'phim, xem phim, phim online, phim mới, phim hay, phim hd',
};

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <body>
                <AuthProvider>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: '#1a1a24',
                                color: '#fff',
                                border: '1px solid #2a2a3e',
                                borderRadius: '8px',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                    <Navbar />
                    <main>{children}</main>
                    <Footer />
                </AuthProvider>
            </body>
        </html>
    );
}
