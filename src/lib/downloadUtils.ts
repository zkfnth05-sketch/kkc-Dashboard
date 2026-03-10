
/**
 * Browser-compatible CSV Downloader with memory optimization
 */
export const downloadCsv = (csvContent: string, filename: string) => {
    try {
        // 1. Create Blob with UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

        // 2. Create Object URL
        const url = window.URL.createObjectURL(blob);

        // 3. Create invisible link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);

        // 4. Append to body (required for some browsers)
        document.body.appendChild(link);
        link.click();

        // 5. Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

        return true;
    } catch (error) {
        console.error("CSV Download Failed:", error);
        return false;
    }
};
