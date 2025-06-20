// client/src/components/Footer.jsx

import React from 'react';

/**
 * Footer
 * Displays a persistent footer with the current year and branding text.
 */
export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-gray-300 mt-auto shadow-md">
            <div className="container mx-auto p-4 text-center text-sm">
                © {currentYear} CaloriesTracker. All rights reserved.
            </div>
        </footer>
    );
}
