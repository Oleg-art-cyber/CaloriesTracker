// client/src/components/Footer.jsx
import React from 'react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-gray-300 mt-auto shadow-md"> {/* Similar style to Navbar */}
            <div className="container mx-auto p-4 text-center text-sm">
                © {currentYear} CaloriesTracker. All rights reserved.
                {/* You can add more simple text or elements here if needed later */}
            </div>
        </footer>
    );
}