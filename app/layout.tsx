import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Smart Bookmark Manager",
    description: "Save and organize your favorite links with real-time sync",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            // Aggressively block MetaMask and Web3 wallet connections
                            (function() {
                                'use strict';
                                
                                // Silence all console errors from MetaMask extension
                                var originalError = console.error;
                                console.error = function() {
                                    var args = Array.prototype.slice.call(arguments);
                                    var errorMsg = args.join(' ');
                                    
                                    // Block MetaMask-related errors from appearing
                                    if (errorMsg.includes('MetaMask') || 
                                        errorMsg.includes('ethereum') || 
                                        errorMsg.includes('inpage.js') ||
                                        errorMsg.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn')) {
                                        return; // Suppress the error
                                    }
                                    
                                    // Allow other errors through
                                    originalError.apply(console, arguments);
                                };
                                
                                // Block window.ethereum completely
                                Object.defineProperty(window, 'ethereum', {
                                    get: function() { return undefined; },
                                    set: function() { /* Do nothing */ },
                                    configurable: false,
                                    enumerable: false
                                });
                                
                                // Block other Web3 properties
                                ['web3', 'solana', 'phantom', 'coinbaseWallet'].forEach(function(prop) {
                                    Object.defineProperty(window, prop, {
                                        get: function() { return undefined; },
                                        set: function() { /* Do nothing */ },
                                        configurable: false,
                                        enumerable: false
                                    });
                                });
                            })();
                        `,
                    }}
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
