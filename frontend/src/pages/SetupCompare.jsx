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

// ── Category Groups ─────────────────────────────────────────
// Sections that should be hidden from the diff view entirely
const HIDDEN_SECTIONS = new Set(['CAR', '__EXT_PATCH', 'ABOUT']);

// Ordered group definitions — each group has a label and a list of INI sections
const SETUP_GROUPS = [
    {
        label: '⚙️ Gears',
        sections: ['INTERNAL_GEAR_2', 'INTERNAL_GEAR_3', 'INTERNAL_GEAR_4', 'INTERNAL_GEAR_5',
            'INTERNAL_GEAR_6', 'INTERNAL_GEAR_7', 'INTERNAL_GEAR_8', 'FINAL_RATIO'],
    },
    {
        label: '🛞 Tyres',
        sections: ['TYRES', 'PRESSURE_LF', 'PRESSURE_RF', 'PRESSURE_LR', 'PRESSURE_RR'],
    },
    {
        label: '⛽ Fuel',
        sections: ['FUEL', 'ENGINE_MAPS'],
    },
    {
        label: '🌬️ Aerodynamics',
        sections: ['WING_0', 'WING_1'],
    },
    {
        label: '🛑 Brakes',
        sections: ['FRONT_BIAS', 'BRAKE_POWER_MULT', 'CUSTOM_SCRIPT_ITEM_1', 'CUSTOM_SCRIPT_ITEM_2'],
    },
    {
        label: '🔧 Drivetrain',
        sections: ['CUSTOM_SCRIPT_ITEM_4', 'CUSTOM_SCRIPT_ITEM_5', 'CUSTOM_SCRIPT_ITEM_6',
            'CUSTOM_SCRIPT_ITEM_7', 'DIFF_PRELOAD'],
    },
    {
        label: '📐 Susp 1: Alignments',
        sections: ['CAMBER_LF', 'CAMBER_RF', 'CAMBER_LR', 'CAMBER_RR',
            'TOE_OUT_LF', 'TOE_OUT_RF', 'TOE_OUT_LR', 'TOE_OUT_RR'],
    },
    {
        label: '🔩 Susp 2: Main',
        sections: ['ARB_FRONT', 'ROD_LENGTH_LF', 'ROD_LENGTH_RF', 'ROD_LENGTH_LR', 'ROD_LENGTH_RR',
            'SPRING_RATE_LF', 'SPRING_RATE_RF', 'SPRING_RATE_LR', 'SPRING_RATE_RR',
            'PACKER_RANGE_LF', 'PACKER_RANGE_RF', 'PACKER_RANGE_LR', 'PACKER_RANGE_RR', 'ARB_REAR'],
    },
    {
        label: '🔽 Susp 3: Dampers',
        sections: ['DAMP_BUMP_LF', 'DAMP_BUMP_LR', 'DAMP_FAST_BUMP_LF', 'DAMP_FAST_BUMP_LR',
            'DAMP_REBOUND_LF', 'DAMP_REBOUND_LR', 'DAMP_FAST_REBOUND_LF', 'DAMP_FAST_REBOUND_LR',
            'DAMP_BUMP_RF', 'DAMP_BUMP_RR', 'DAMP_FAST_BUMP_RF', 'DAMP_FAST_BUMP_RR',
            'DAMP_REBOUND_RF', 'DAMP_REBOUND_RR', 'DAMP_FAST_REBOUND_RF', 'DAMP_FAST_REBOUND_RR'],
    },
    {
        label: '⬆️ Susp 4: Heave',
        sections: ['SPRING_RATE_HF', 'PACKER_RANGE_HF', 'BUMPSTOP_HF',
            'DAMP_BUMP_HF', 'DAMP_FAST_BUMP_HF', 'DAMP_REBOUND_HF', 'DAMP_FAST_REBOUND_HF',
            'DAMP_BUMP_HR', 'DAMP_FAST_BUMP_HR', 'DAMP_REBOUND_HR', 'DAMP_FAST_REBOUND_HR',
            'SPRING_RATE_HR', 'PACKER_RANGE_HR', 'BUMPSTOP_HR'],
    },
    {
        label: '🎛️ Various',
        sections: ['STEER_ASSIST'],
    },
    {
        label: '📊 Visual: MFD',
        sections: ['CUSTOM_SCRIPT_ITEM_3'],
    },
    {
        label: '🎨 Visuals',
        sections: ['WING_11', 'WING_12', 'WING_13'],
    },
];

// Build a lookup: section name → group label
const SECTION_TO_GROUP = new Map();
for (const group of SETUP_GROUPS) {
    for (const sec of group.sections) {
        SECTION_TO_GROUP.set(sec, group.label);
    }
}

// Organise diff rows into ordered groups, filtering hidden sections
function groupDiffRows(rows) {
    // Create a map of group label → rows (preserving group order)
    const grouped = new Map();
    for (const g of SETUP_GROUPS) {
        grouped.set(g.label, []);
    }
    grouped.set('❓ Uncategorised', []);

    for (const row of rows) {
        if (HIDDEN_SECTIONS.has(row.section)) continue;
        const groupLabel = SECTION_TO_GROUP.get(row.section) ?? '❓ Uncategorised';
        grouped.get(groupLabel).push(row);
    }

    // Return only non-empty groups
    return [...grouped.entries()].filter(([, rows]) => rows.length > 0);
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

    // Compute visible rows (excluding hidden sections) for summary counts
    const visibleRows = diffRows
        ? diffRows.filter((r) => !HIDDEN_SECTIONS.has(r.section))
        : null;
    const diffCount = visibleRows ? visibleRows.filter((r) => !r.same).length : 0;
    const sameCount = visibleRows ? visibleRows.filter((r) => r.same).length : 0;
    const groups = diffRows ? groupDiffRows(diffRows) : null;

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

                {/* Grouped Diff Sections */}
                {groups && groups.map(([groupLabel, rows]) => {
                    const groupDiffCount = rows.filter((r) => !r.same).length;
                    return (
                        <div key={groupLabel} className="diff-group animate-in">
                            <div className="diff-group-header">
                                <h3 className="diff-group-title">{groupLabel}</h3>
                                {groupDiffCount > 0 && (
                                    <span className="diff-group-badge">{groupDiffCount} diff</span>
                                )}
                            </div>
                            <div className="diff-section">
                                <div className="diff-header">
                                    <span>Key</span>
                                    <span style={{ textAlign: 'center' }}>Current</span>
                                    <span style={{ textAlign: 'center' }}></span>
                                    <span style={{ textAlign: 'center' }}>Target</span>
                                </div>
                                <div className="diff-list">
                                    {rows.map((row) => (
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
