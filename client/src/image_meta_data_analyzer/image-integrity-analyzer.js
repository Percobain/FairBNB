// Frontend Image Integrity Analyzer - Browser Compatible
// Import: import ImageIntegrityAnalyzer from './ImageIntegrityAnalyzer.js';

class ImageIntegrityAnalyzer {
    constructor() {
        // Known software that commonly indicates editing/manipulation
        this.editingSoftware = [
            'adobe photoshop', 'photoshop', 'gimp', 'canva', 'pixlr',
            'lightroom', 'snapseed', 'vsco', 'facetune', 'beautycam',
            'meitu', 'airbrush', 'perfect365', 'fotor', 'photoscape',
            'paint.net', 'corel', 'affinity photo', 'luminar', 'skylum'
        ];

        // AI-related software indicators
        this.aiSoftware = [
            'midjourney', 'dalle', 'stable diffusion', 'firefly',
            'topaz', 'real-esrgan', 'waifu2x', 'deepai', 'runway',
            'artbreeder', 'nvidia', 'gan', 'neural', 'ai enhance'
        ];

        // Suspicious camera models (often used by editing apps)
        this.suspiciousModels = [
            'iphone', 'android', 'unknown', '', null, undefined
        ];
    }

    async analyzeImage(file) {
        try {
            if (!file || !file instanceof File) {
                throw new Error('Invalid file input. Expected File object.');
            }

            // Convert File to ArrayBuffer
            const arrayBuffer = await this.fileToArrayBuffer(file);
            
            // Extract comprehensive EXIF data from buffer
            const metadata = await this.parseExifData(arrayBuffer);

            if (!metadata) {
                return {
                    nftMetadata: this.getDefaultNftMetadata(file.name),
                    integrityScore: 1,
                    analysis: {
                        issues: ['No EXIF data found - highly suspicious'],
                        warnings: [],
                        score: 1
                    }
                };
            }

            // Extract NFT metadata
            const nftMetadata = this.extractNftMetadata(metadata, file.name, file.size);
            
            // Analyze tampering indicators
            const analysis = this.analyzeTampering(metadata);
            
            // Calculate file hash for uniqueness verification
            const fileHash = await this.calculateFileHash(arrayBuffer);
            
            return {
                nftMetadata: {
                    ...nftMetadata,
                    fileHash,
                    integrityScore: analysis.score
                },
                integrityScore: analysis.score,
                analysis,
                fullMetadata: metadata
            };

        } catch (error) {
            console.error('Error analyzing image:', error.message);
            return {
                nftMetadata: this.getDefaultNftMetadata(file?.name),
                integrityScore: 1,
                analysis: {
                    issues: [`Analysis failed: ${error.message}`],
                    warnings: [],
                    score: 1
                }
            };
        }
    }

    async fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async parseExifData(arrayBuffer) {
        try {
            // Simple EXIF parser for frontend - basic implementation
            // Note: You might want to use a library like 'exifr' or 'piexifjs' for more comprehensive parsing
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Check if it's a JPEG file
            if (uint8Array[0] !== 0xFF || uint8Array[1] !== 0xD8) {
                return null; // Not a JPEG
            }

            const metadata = this.extractBasicExifData(uint8Array);
            return metadata;

        } catch (error) {
            console.warn('EXIF parsing failed:', error.message);
            return null;
        }
    }

    extractBasicExifData(uint8Array) {
        // Basic EXIF extraction - simplified for frontend use
        // This is a minimal implementation. For production, consider using exifr library
        const metadata = {};
        
        // Look for EXIF marker (0xFFE1)
        for (let i = 0; i < uint8Array.length - 1; i++) {
            if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xE1) {
                // Found APP1 segment, try to extract basic info
                const segmentLength = (uint8Array[i + 2] << 8) | uint8Array[i + 3];
                const exifData = uint8Array.slice(i + 4, i + 4 + segmentLength);
                
                // Convert to string to look for text-based metadata
                const exifString = String.fromCharCode.apply(null, exifData);
                
                // Extract software information (basic pattern matching)
                const softwareMatch = exifString.match(/Software\x00([^\x00]+)/);
                if (softwareMatch) {
                    metadata.Software = softwareMatch[1];
                }
                
                // Extract make information
                const makeMatch = exifString.match(/Make\x00([^\x00]+)/);
                if (makeMatch) {
                    metadata.Make = makeMatch[1];
                }
                
                // Extract model information
                const modelMatch = exifString.match(/Model\x00([^\x00]+)/);
                if (modelMatch) {
                    metadata.Model = modelMatch[1];
                }
                
                // Extract DateTime
                const dateMatch = exifString.match(/DateTime\x00([^\x00]+)/);
                if (dateMatch) {
                    metadata.DateTime = dateMatch[1];
                }
                
                // Extract DateTimeOriginal
                const dateOrigMatch = exifString.match(/DateTimeOriginal\x00([^\x00]+)/);
                if (dateOrigMatch) {
                    metadata.DateTimeOriginal = dateOrigMatch[1];
                }
                
                break;
            }
        }
        
        return Object.keys(metadata).length > 0 ? metadata : null;
    }

    extractNftMetadata(metadata, filename, fileSize) {
        // Extract creation date (multiple possible sources)
        const creationDate = this.extractCreationDate(metadata);
        
        // Extract modification date
        const modificationDate = this.extractModificationDate(metadata);

        return {
            originalCreationDate: creationDate,
            lastModifiedDate: modificationDate,
            extractedAt: new Date().toISOString(),
            filename: filename || 'unknown',
            fileSize: fileSize || 0,
            cameraInfo: {
                make: metadata.Make || null,
                model: metadata.Model || null,
                software: metadata.Software || null
            }
        };
    }

    extractCreationDate(metadata) {
        // Priority order for creation date
        const dateFields = [
            'DateTimeOriginal',
            'CreateDate', 
            'DateTime',
            'DateTimeDigitized',
            'ModifyDate'
        ];

        for (const field of dateFields) {
            if (metadata[field]) {
                try {
                    // Convert EXIF date format (YYYY:MM:DD HH:MM:SS) to ISO
                    const exifDate = metadata[field].replace(/:/g, '-', 2);
                    return new Date(exifDate).toISOString();
                } catch (e) {
                    continue;
                }
            }
        }

        return null;
    }

    extractModificationDate(metadata) {
        // Fields that indicate modification
        const modFields = [
            'ModifyDate',
            'DateTime',
            'FileModifyDate'
        ];

        for (const field of modFields) {
            if (metadata[field]) {
                try {
                    const exifDate = metadata[field].replace(/:/g, '-', 2);
                    return new Date(exifDate).toISOString();
                } catch (e) {
                    continue;
                }
            }
        }

        return null;
    }

    analyzeTampering(metadata) {
        let score = 10; // Start with perfect score
        let issues = [];
        let warnings = [];

        // 1. Check for editing software (Major red flag)
        const softwareCheck = this.checkEditingSoftware(metadata);
        score -= softwareCheck.penalty;
        issues = issues.concat(softwareCheck.issues);
        warnings = warnings.concat(softwareCheck.warnings);

        // 2. Check for AI generation indicators
        const aiCheck = this.checkAiGeneration(metadata);
        score -= aiCheck.penalty;
        issues = issues.concat(aiCheck.issues);

        // 3. Analyze EXIF consistency
        const consistencyCheck = this.checkExifConsistency(metadata);
        score -= consistencyCheck.penalty;
        issues = issues.concat(consistencyCheck.issues);
        warnings = warnings.concat(consistencyCheck.warnings);

        // 4. Check for missing critical data
        const missingDataCheck = this.checkMissingData(metadata);
        score -= missingDataCheck.penalty;
        warnings = warnings.concat(missingDataCheck.warnings);

        // 5. Analyze timestamp patterns
        const timestampCheck = this.analyzeTimestamps(metadata);
        score -= timestampCheck.penalty;
        warnings = warnings.concat(timestampCheck.warnings);

        // Ensure score is between 1 and 10
        score = Math.max(1, Math.min(10, Math.round(score)));

        return {
            score,
            issues,
            warnings,
            breakdown: {
                software: 10 - softwareCheck.penalty,
                ai: 10 - aiCheck.penalty,
                consistency: 10 - consistencyCheck.penalty,
                completeness: 10 - missingDataCheck.penalty,
                timestamps: 10 - timestampCheck.penalty
            }
        };
    }

    checkEditingSoftware(metadata) {
        const software = (metadata.Software || '').toLowerCase();
        const make = (metadata.Make || '').toLowerCase();
        const model = (metadata.Model || '').toLowerCase();
        
        let penalty = 0;
        let issues = [];
        let warnings = [];

        // Check for editing software
        for (const editSoft of this.editingSoftware) {
            if (software.includes(editSoft) || make.includes(editSoft)) {
                penalty += 4;
                issues.push(`Editing software detected: ${metadata.Software || metadata.Make}`);
                break;
            }
        }

        // Check for AI software
        for (const aiSoft of this.aiSoftware) {
            if (software.includes(aiSoft) || make.includes(aiSoft) || model.includes(aiSoft)) {
                penalty = 9; // Almost certainly AI generated
                issues.push(`AI generation software detected: ${metadata.Software || metadata.Make || metadata.Model}`);
                break;
            }
        }

        return { penalty, issues, warnings };
    }

    checkAiGeneration(metadata) {
        let penalty = 0;
        let issues = [];

        // Check for suspicious lack of camera-specific data
        if (!metadata.Make && !metadata.Model) {
            penalty += 2;
            issues.push('Missing camera manufacturer and model information');
        }

        return { penalty, issues };
    }

    checkExifConsistency(metadata) {
        let penalty = 0;
        let issues = [];
        let warnings = [];

        // Check date consistency
        const dates = {
            original: metadata.DateTimeOriginal,
            created: metadata.CreateDate,
            modified: metadata.ModifyDate || metadata.DateTime
        };

        const validDates = Object.values(dates).filter(d => d);
        
        if (validDates.length > 1) {
            // Check if modification date is significantly different from creation
            if (dates.original && dates.modified) {
                try {
                    const origTime = new Date(dates.original.replace(/:/g, '-', 2)).getTime();
                    const modTime = new Date(dates.modified.replace(/:/g, '-', 2)).getTime();
                    const diffHours = Math.abs(modTime - origTime) / (1000 * 60 * 60);
                    
                    if (diffHours > 24) {
                        penalty += 2;
                        warnings.push(`Image modified ${Math.round(diffHours/24)} days after creation`);
                    } else if (diffHours > 1) {
                        penalty += 1;
                        warnings.push(`Image modified ${Math.round(diffHours)} hours after creation`);
                    }
                } catch (e) {
                    // Date parsing failed
                    warnings.push('Could not parse dates for consistency check');
                }
            }
        }

        return { penalty, issues, warnings };
    }

    checkMissingData(metadata) {
        let penalty = 0;
        let warnings = [];

        const criticalFields = [
            'Make', 'Model', 'DateTime'
        ];

        let missingCritical = 0;

        criticalFields.forEach(field => {
            if (!metadata[field]) {
                missingCritical++;
            }
        });

        penalty += missingCritical * 1;

        if (missingCritical > 0) {
            warnings.push(`Missing ${missingCritical} critical EXIF fields`);
        }

        return { penalty, warnings };
    }

    analyzeTimestamps(metadata) {
        let penalty = 0;
        let warnings = [];

        // Check if all timestamps are exactly the same (suspicious)
        const timestamps = [
            metadata.DateTimeOriginal,
            metadata.CreateDate,
            metadata.ModifyDate || metadata.DateTime
        ].filter(t => t);

        if (timestamps.length > 1) {
            const uniqueTimestamps = [...new Set(timestamps)];
            
            if (uniqueTimestamps.length === 1 && timestamps.length > 2) {
                penalty += 1;
                warnings.push('All timestamps are identical (unusual)');
            }
        }

        // Check for future dates
        const now = new Date();
        timestamps.forEach(timestamp => {
            try {
                const date = new Date(timestamp.replace(/:/g, '-', 2));
                if (date > now) {
                    penalty += 2;
                    warnings.push('Image contains future timestamps');
                }
            } catch (e) {
                // Skip invalid dates
            }
        });

        return { penalty, warnings };
    }

    async calculateFileHash(arrayBuffer) {
        try {
            // Use Web Crypto API for hashing
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (error) {
            console.warn('Could not calculate file hash:', error.message);
            return 'hash-unavailable';
        }
    }

    getDefaultNftMetadata(filename = null, fileSize = 0) {
        return {
            originalCreationDate: null,
            lastModifiedDate: null,
            extractedAt: new Date().toISOString(),
            filename: filename || 'unknown',
            fileSize: fileSize || 0,
            cameraInfo: {
                make: null,
                model: null,
                software: null
            }
        };
    }

    // Utility method to get human-readable integrity report
    getIntegrityReport(analysis) {
        let report = `Integrity Score: ${analysis.score}/10\n\n`;
        
        if (analysis.score >= 9) {
            report += "✅ EXCELLENT: Image appears to be unmodified original\n";
        } else if (analysis.score >= 7) {
            report += "🟡 GOOD: Minor concerns but likely authentic\n";
        } else if (analysis.score >= 5) {
            report += "🟠 MODERATE: Some tampering indicators present\n";
        } else if (analysis.score >= 3) {
            report += "🔴 POOR: Significant editing detected\n";
        } else {
            report += "❌ VERY POOR: Likely heavily modified or AI generated\n";
        }

        if (analysis.issues.length > 0) {
            report += "\n🚨 Critical Issues:\n";
            analysis.issues.forEach(issue => report += `  • ${issue}\n`);
        }

        if (analysis.warnings.length > 0) {
            report += "\n⚠️  Warnings:\n";
            analysis.warnings.forEach(warning => report += `  • ${warning}\n`);
        }

        return report;
    }
}

// Export for ES6 modules
export default ImageIntegrityAnalyzer;

// For CommonJS (if needed)
// module.exports = ImageIntegrityAnalyzer;