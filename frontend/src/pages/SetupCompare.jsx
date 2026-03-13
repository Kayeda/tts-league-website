import { useState, useCallback } from 'react';
import './SetupCompare.css';

// ── INI Parser ──────────────────────────────────────────────
// Returns an ordered array of { section, key, value } entries
// and preserves the original section order for serialisation.
function parseIni(text) {
    const entries = [];
    let currentSection = '';
    const lines = text.replace(/\r\n/g, '\n').split('\n');

    for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;

        const sectionMatch = line.match(/^\[(.+)\]$/);
        if (sectionMatch) {
            currentSection = sectionMatch[1];
            continue;
        }

        const kvMatch = line.match(/^([^=]+)=(.*)$/);
        if (kvMatch) {
            entries.push({
                section: currentSection,
                key: kvMatch[1].trim(),
                value: kvMatch[2].trim(),
            });
        }
    }
    return entries;
}

// Convert entries array back to INI text
function serialiseIni(entries) {
    const sections = [];
    const sectionMap = new Map();

    for (const e of entries) {
        if (!sectionMap.has(e.section)) {
            sectionMap.set(e.section, []);
            sections.push(e.section);
        }
        sectionMap.get(e.section).push(e);
    }

    let out = '';
    for (const sec of sections) {
        if (sec) out += `[${sec}]\n`;
        for (const e of sectionMap.get(sec)) {
            out += `${e.key}=${e.value}\n`;
        }
        out += '\n';
    }
    return out;
}

// Build a composite key for comparison
function compositeKey(entry) {
    return `${entry.section}||${entry.key}`;
}

// ── Component ───────────────────────────────────────────────
export default function SetupCompare() {
    const [currentFile, setCurrentFile] = useState(null); // { name, entries }
    const [targetFile, setTargetFile] = useState(null);
    const [diffRows, setDiffRows] = useState(null);

    // Read a .ini file and store its parsed entries
    const handleFile = useCallback((which) => (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const entries = parseIni(ev.target.result);
            const data = { name: file.name, entries };
            if (which === 'current') setCurrentFile(data);
            else setTargetFile(data);
            setDiffRows(null); // reset comparison on new upload
        };
        reader.readAsText(file);
    }, []);

    // Compare the two setups
    const handleCompare = useCallback(() => {
        if (!currentFile || !targetFile) return;

        const currentMap = new Map();
        currentFile.entries.forEach((e) => currentMap.set(compositeKey(e), e));

        const targetMap = new Map();
        targetFile.entries.forEach((e) => targetMap.set(compositeKey(e), e));

        // Union of all keys, preserving order from current first, then any extra from target
        const allKeys = new Set([...currentMap.keys(), ...targetMap.keys()]);

        const rows = [];
        for (const ck of allKeys) {
            const c = currentMap.get(ck);
            const t = targetMap.get(ck);
            rows.push({
                compositeKey: ck,
                section: c?.section ?? t?.section ?? '',
                key: c?.key ?? t?.key ?? '',
                currentValue: c?.value ?? '—',
                targetValue: t?.value ?? '—',
                same: c?.value === t?.value,
                existsInCurrent: !!c,
                existsInTarget: !!t,
            });
        }
        setDiffRows(rows);
    }, [currentFile, targetFile]);

    // Copy value between setups (direction: 'toTarget' or 'toCurrent')
    const handleCopy = useCallback((ck, direction) => {
        setCurrentFile((prev) => {
            if (!prev) return prev;
            const copy = { ...prev, entries: prev.entries.map((e) => ({ ...e })) };
            if (direction === 'toCurrent') {
                // Find value from diffRows
                const row = diffRows.find((r) => r.compositeKey === ck);
                if (!row) return prev;
                const idx = copy.entries.findIndex((e) => compositeKey(e) === ck);
                if (idx >= 0) {
                    copy.entries[idx].value = row.targetValue;
                }
            }
            return copy;
        });

        setTargetFile((prev) => {
            if (!prev) return prev;
            const copy = { ...prev, entries: prev.entries.map((e) => ({ ...e })) };
            if (direction === 'toTarget') {
                const row = diffRows.find((r) => r.compositeKey === ck);
                if (!row) return prev;
                const idx = copy.entries.findIndex((e) => compositeKey(e) === ck);
                if (idx >= 0) {
                    copy.entries[idx].value = row.currentValue;
                }
            }
            return copy;
        });

        // Update diffRow values inline
        setDiffRows((prev) =>
            prev.map((r) => {
                if (r.compositeKey !== ck) return r;
                if (direction === 'toTarget') {
                    return { ...r, targetValue: r.currentValue, same: true };
                } else {
                    return { ...r, currentValue: r.targetValue, same: true };
                }
            }),
        );
    }, [diffRows]);

    // Download helper
    const handleDownload = useCallback((which) => {
        const data = which === 'current' ? currentFile : targetFile;
        if (!data) return;

        const text = serialiseIni(data.entries);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.name || 'setup.ini';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [currentFile, targetFile]);

    const diffCount = diffRows ? diffRows.filter((r) => !r.same).length : 0;
    const sameCount = diffRows ? diffRows.filter((r) => r.same).length : 0;

    return (
        <div className="setup-compare">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">Setup Comparison</h1>
                    <p className="page-subtitle">
                        Upload two setup files, compare differences, and merge values
                    </p>
                </div>

                {/* Upload Section */}
                <div className="upload-section">
                    <label className={`upload-zone ${currentFile ? 'has-file' : ''}`}>
                        <input
                            type="file"
                            accept=".ini"
                            onChange={handleFile('current')}
                            id="upload-current"
                        />
                        <span className="upload-icon">{currentFile ? '✅' : '📂'}</span>
                        <span className="upload-label">Current Setup</span>
                        {currentFile ? (
                            <span className="upload-filename">{currentFile.name}</span>
                        ) : (
                            <span className="upload-hint">Click to upload .ini file</span>
                        )}
                    </label>

                    <label className={`upload-zone ${targetFile ? 'has-file' : ''}`}>
                        <input
                            type="file"
                            accept=".ini"
                            onChange={handleFile('target')}
                            id="upload-target"
                        />
                        <span className="upload-icon">{targetFile ? '✅' : '📂'}</span>
                        <span className="upload-label">Target Setup</span>
                        {targetFile ? (
                            <span className="upload-filename">{targetFile.name}</span>
                        ) : (
                            <span className="upload-hint">Click to upload .ini file</span>
                        )}
                    </label>
                </div>

                {/* Compare Button */}
                {currentFile && targetFile && (
                    <div className="compare-actions">
                        <button className="btn-compare" onClick={handleCompare} id="btn-compare">
                            🔍 Compare
                        </button>
                    </div>
                )}

                {/* Download Buttons */}
                {diffRows && (
                    <div className="download-actions">
                        <button
                            className="btn-download"
                            onClick={() => handleDownload('current')}
                            id="btn-download-current"
                        >
                            ⬇️ Download Current
                        </button>
                        <button
                            className="btn-download"
                            onClick={() => handleDownload('target')}
                            id="btn-download-target"
                        >
                            ⬇️ Download Target
                        </button>
                    </div>
                )}

                {/* Diff Summary */}
                {diffRows && (
                    <div className="diff-summary">
                        <span className="badge badge-success">{sameCount} Identical</span>
                        <span className="badge" style={{
                            background: 'rgba(248,113,113,0.15)',
                            color: 'var(--color-danger)',
                            border: '1px solid rgba(248,113,113,0.3)',
                        }}>
                            {diffCount} Different
                        </span>
                    </div>
                )}

                {/* Diff Table */}
                {diffRows && (
                    <div className="diff-section">
                        <div className="diff-header">
                            <span>Key</span>
                            <span style={{ textAlign: 'center' }}>Current</span>
                            <span style={{ textAlign: 'center' }}></span>
                            <span style={{ textAlign: 'center' }}>Target</span>
                        </div>
                        <div className="diff-list">
                            {diffRows.map((row) => (
                                <div
                                    key={row.compositeKey}
                                    className={`diff-row ${row.same ? 'same' : 'different'}`}
                                >
                                    <div className="diff-key">
                                        <span className="diff-section-name">[{row.section}]</span>
                                        {row.key}
                                    </div>
                                    <div className="diff-value">{row.currentValue}</div>
                                    <div className="diff-arrows">
                                        {!row.same && row.existsInCurrent && row.existsInTarget ? (
                                            <>
                                                <button
                                                    className="arrow-btn"
                                                    title="Copy Target → Current"
                                                    onClick={() => handleCopy(row.compositeKey, 'toCurrent')}
                                                >
                                                    ←
                                                </button>
                                                <button
                                                    className="arrow-btn"
                                                    title="Copy Current → Target"
                                                    onClick={() => handleCopy(row.compositeKey, 'toTarget')}
                                                >
                                                    →
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                    <div className="diff-value">{row.targetValue}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
