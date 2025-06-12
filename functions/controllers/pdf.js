const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const { getFirestore } = require('../config/firebase');
const { alertsListJson } = require('../utils/alertJson');

const downloadPdf = async (req, res) => {
    try {
        const companyId = req.body.kid;
        console.log("downloadPdf :: companyId :: ", companyId);

        if (!companyId) return res.status(400).send("Missing companyId");

        // Fetch company by kid from Firestore
        const db = getFirestore();
        const companySnap = await db.collection('companies').where('kid', '==', companyId).limit(1).get();
        if (companySnap.empty) return res.status(404).send("Company not found");
        const company = companySnap.docs[0].data();

        // Read the template file
        // const templatePath = path.join(process.cwd(), "src/templates/companyReport.html");
        const templatePath = path.join(__dirname, "../templates/companyReport.html");
        const cssPath = path.join(__dirname, "../templates/styles.css");
        const jsPath = path.join(__dirname, "../templates/chart.js");

        const template = fs.readFileSync(templatePath, "utf8");
        const cssContent = fs.readFileSync(cssPath, "utf8");
        const jsContent = fs.readFileSync(jsPath, "utf8");

        // Read the logo file and convert to base64
        const logoPath = path.join(__dirname, "../assets/images/saakh_1.jpg");
        const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });

        // Register the 'times' helper for Handlebars
        Handlebars.registerHelper('times', function (n, block) {
            var accum = '';
            for (var i = 0; i < n; ++i)
                accum += block.fn(i);
            return accum;
        });

        Handlebars.registerHelper("json", function (context) {
            return JSON.stringify(context);
        });
        // console.log("company :: ", company);

        const gstEntry = company.statutoryRegistration?.gst[0];

        const currentRevenue = gstEntry?.aggregateTurnovers[gstEntry.aggregateTurnovers.length - 1]?.turnover;
        const currentFinancialYear = gstEntry?.aggregateTurnovers[gstEntry.aggregateTurnovers.length - 1]?.financialYear;

        const alertMetadataMap = alertsListJson.reduce((acc, item) => {
            acc[item.alert] = item;
            return acc;
        }, {});

        const parseIndianNumber = (value) => {
            value = value.trim();
            if (value.toLowerCase().includes("slab: rs.")) {
                value = value.replace(/Slab: Rs\./i, "").trim();
                value = value.replace(/and above/i, "").trim();
            }

            if (value.includes("to")) {
                const parts = value.split("to");
                const low = _parseAmount(parts[0].trim());
                const high = _parseAmount(parts[1].trim());
                return (low + high) / 2;
            }

            return _parseAmount(value);
        };

        const _parseAmount = (value) => {
            if (value.toLowerCase().includes("lakh")) {
                return (
                    (parseFloat(value.replace(/[^\d.]/g, "")) || 0) * 1e5
                );
            } else if (value.toLowerCase().includes("cr")) {
                return (
                    (parseFloat(value.replace(/[^\d.]/g, "")) || 0) * 1e7
                );
            }
            return parseFloat(value) || 0;
        };

        const geFinancialData = () => {
            try {
                const financialMap = new Map();

                const gstEntries = (company?.statutoryRegistration?.gst) || [];
                for (const gst of gstEntries) {
                    if (gst?.aggregateTurnovers && Array.isArray(gst.aggregateTurnovers)) {
                        for (const entry of gst.aggregateTurnovers) {
                            if (entry?.financialYear && entry?.turnover) {
                                const year = entry.financialYear;
                                const turnover = parseIndianNumber(entry.turnover);
                                financialMap.set(year, (financialMap.get(year) || 0) + turnover);
                            }
                        }
                    }
                }

                const financialData = Array.from(financialMap, ([year, revenue]) => ({
                    year,
                    revenue: revenue / 10000000
                }));
                return {
                    financialData,
                };
            } catch (error) {
                console.log("error :: error :: ", error);
            }
        }

        const getRevenueSlabIndex = (revenue) => {
            if (revenue <= 0.4) return 0;
            if (revenue <= 1.5) return 1;
            if (revenue <= 5) return 2;
            if (revenue <= 20) return 3;
            if (revenue <= 50) return 4;
            if (revenue <= 100) return 5;
            if (revenue <= 500) return 6;
            return 7;
        };

        const processedData = geFinancialData()?.financialData?.map((item) => ({
            ...item,
            slabIndex: getRevenueSlabIndex(item.revenue)
        })) ?? [];

        const getEmployeeGraphData = () => {
            const epfData = company?.statutoryRegistration?.epf?.[0];
            const counts = epfData?.employeeCounts || [];
            if (!Array.isArray(counts) || counts.length === 0) return [];
            const sortedData = counts.sort((a, b) =>
                a.wageYearMonth_.localeCompare(b.wageYearMonth_)
            );
            const last36Months = sortedData.slice(-36);
            const slabs = [];
            for (let i = 0; i < last36Months.length; i += 3) {
                slabs.push(last36Months[i]);
            }
            return slabs;
        };

        const parseDate = (str) => {
            if (!str) return null;
            const [dd, mm, yyyy] = str.split("-");
            return new Date(`${yyyy}-${mm}-${dd}`);
        };

        const getQuarterStartDates = () => {
            const dates = [];
            const now = new Date();
            const start = new Date(now.getFullYear() - 3, now.getMonth(), 1);
            const current = new Date(start.getFullYear(), start.getMonth() - (start.getMonth() % 3), 1);
            while (current <= now) {
                dates.push(new Date(current));
                current.setMonth(current.getMonth() + 3);
            }
            return dates;
        };

        const formatLabel = (date) =>
            date.toLocaleString('en-US', { month: 'short', year: 'numeric' });

        const buildCumulativeData = (() => {
            const quarters = getQuarterStartDates();
            const labels = quarters.map(formatLabel);
            const data = [];

            for (const quarter of quarters) {
                let total = 0;
                for (const charge of company.charges) {
                    const start = parseDate(charge.dateOfCreation);
                    const end = charge.dateOfSatisfaction ? parseDate(charge.dateOfSatisfaction) : null;

                    if (start && start <= quarter && (!end || end >= quarter)) {
                        total += charge.amount ?? 0;
                    }
                }
                data.push(total);
            }
            return { labels, data };
        });

        // const enrichedAlerts = company.alertList.map(alert => {
        //   const matchedAlert = alertsListJson.find(ref => ref.alert === alert.alert);
        //   console.log("matchedAlert :: matchedAlert :: ", matchedAlert);
        //   console.log("matchedAlert :: alert :: ", alert);

        //   return {
        //     ...alert,
        //     ...(matchedAlert || {})
        //   };
        // });
        // console.log("enrichedAlerts :: enrichedAlerts :: ", enrichedAlerts);

        const alertList = company.alertList
            ?.filter(alert => alert.exists === true && !!alert.alert)
            .map(alert => {
                const alertKey = alert.alert ?? '';
                const metadata = alertMetadataMap[alertKey] || {};
                return {
                    alert: alert.alert,
                    exists: alert.exists,
                    severity: alert.severity,
                    documentUrl: alert.documentUrl,
                    lastUpdatedDate: alert.lastUpdatedDate,
                    alertName: metadata.AlertName || alert.alert,
                };
            }) || [];


        const templateData = {
            companyName: company.name,
            thumbnailUrl: company.thumbnailUrl,
            description: company.description || "Company description not available",
            gstin: company.gstin,
            pan: company.pan,
            loadData: buildCumulativeData(),
            dateOfRegistration: company.dateOfRegistration ? new Date(company.dateOfRegistration).toLocaleDateString() : 'Not Available',
            constitutionOfBusiness: company.constitutionOfBusiness,
            businessType: company.businessType,
            domain: company.domain,
            owner: company.owner,
            addresses: company.address,
            phone: company.phone?.join(", "),
            email: company.email?.join(", "),
            currentDate: new Date().toLocaleDateString(),
            logoBase64: `data:image/jpeg;base64,${logoBase64}`,
            rating: company.googleRating,
            reviewCount: company.googleRatingCount,
            services: company.natureOfBusiness,
            social_media: {
                linkedin: {
                    url: Array.isArray(company.social_media) ? company.social_media.find(s => s.platform === "LinkedIn")?.url : undefined,
                    followers: Array.isArray(company.social_media) ? (company.social_media.find(s => s.platform === "LinkedIn")?.followers || 0) : 0
                },
                youtube: {
                    url: Array.isArray(company.social_media) ? company.social_media.find(s => s.platform === "YouTube")?.url : undefined,
                    followers: Array.isArray(company.social_media) ? (company.social_media.find(s => s.platform === "YouTube")?.followers || 0) : 0
                },
                instagram: {
                    url: Array.isArray(company.social_media) ? company.social_media.find(s => s.platform === "Instagram")?.url : undefined,
                    followers: Array.isArray(company.social_media) ? (company.social_media.find(s => s.platform === "Instagram")?.followers || 0) : 0
                }
            },
            currentRevenue: currentRevenue,
            currentFinancialYear: currentFinancialYear,
            reviews: (company.google_reviews || []).map((r) => ({
                author_name: r.author_name,
                author_url: r.author_url,
                profile_photo_url: r.profile_photo_url,
                rating: r.rating,
                time: r.relative_time_description,
                text: r.text
            })),
            images: company.images || [],
            management: {
                source: company.management?.source,
                current: company.management?.current?.map(person => ({
                    kid: person.kid,
                    din: person.din,
                    name: person.name,
                    gender: person.gender,
                    email: person.email,
                    nationality: person.nationality,
                    designation: person.designation,
                    dateOfBirth: person.dateOfBirth,
                    tenureBeginDate: person.tenureBeginDate,
                    tenureEndDate: person.tenureEndDate,
                    address: person.address,
                    city: person.city,
                    state: person.state
                })) || [],
                former: company.management?.former?.map(person => ({
                    kid: person.kid,
                    din: person.din,
                    name: person.name,
                    gender: person.gender,
                    designation: person.designation,
                    tenureBeginDate: person.tenureBeginDate,
                    tenureEndDate: person.tenureEndDate
                })) || []
            },
            financialData: processedData,
            employeeCounts: getEmployeeGraphData(),
            statutoryRegistration: {
                gst: company.statutoryRegistration?.gst
                    ? Object.values(company.statutoryRegistration.gst).map(gstEntry => {
                        const entry = gstEntry;
                        return {
                            gstin: entry.gstin,
                            transactionDelays: entry.transactionDelays?.map(delay => ({
                                returnYearMonth: delay.returnYearMonth,
                                dateOfFiling: delay.dateOfFiling,
                                revisedDueDateOfFiling: delay.revisedDueDateOfFiling,
                                noOfDaysOfDelay: delay.noOfDaysOfDelay
                            })) || []
                        };
                    })
                    : []
            },
            creditRatings: company.creditRatings?.map(rating => ({
                dateOfIssuance: rating.dateOfIssuance,
                amount: rating.amount,
                instrument: rating.instrument,
                rating: rating.rating,
                ratingAgency: rating.ratingAgency,
                ratingTerm: rating.ratingTerm,
                ratingRationale: rating.ratingRationale
            })) || [],
            competitors: Array.isArray(company.competitors)
    ? company.competitors.map(competitor => ({
        name: competitor.name,
        address: competitor.address,
        rating: competitor.rating,
        ratingCount: competitor.ratingCount,
        cid: competitor.cid
    }))
    : [],
            products: Array.isArray(company.products)
    ? company.products.flatMap((category) => {
        return Array.isArray(category.products)
            ? category.products.map((p) => ({
                name: p.name,
                link: p.link,
                image: p.image,
                category: category.category,
                description: category.description
            }))
            : [];
    })
    : [],
            gstGoodsDetails: company.gstGoodsDetails?.map(good => ({
                hsnCode: good.hsnCode,
                chapter: good.chapter,
                section: good.section,
                description: good.description,
                gstinCount: good.gstinCount,
                asPercentOfTotalCount: good.asPercentOfTotalCount
            })) || [],
            gstServicesDetails: company.gstServicesDetails?.map(service => ({
                sacCode: service.sacCode,
                description: service.description,
                gstinCount: service.gstinCount,
                asPercentOfTotalCount: service.asPercentOfTotalCount
            })) || [],
            charges: company.charges?.map(charge => ({
                chargeHolderName: charge.chargeHolderName,
                amount: charge.amount,
                dateOfCreation: charge.dateOfCreation,
                dateOfModification: charge.dateOfModification,
                dateOfSatisfaction: charge.dateOfSatisfaction,
                status: charge.status
            })) || [],
            alertSummary: company.alertSummary || {},
            alertCount: {
                severe: alertList.filter(alert => alert.severity === 'severe').length,
                high: alertList.filter(alert => alert.severity === 'high').length,
                medium: alertList.filter(alert => alert.severity === 'medium').length,
                low: alertList.filter(alert => alert.severity === 'low').length,
            },
            alertList: company.alertList
                ?.filter(alert => alert.exists === true && !!alert.alert)
                .map(alert => {
                    const alertKey = alert.alert ?? '';
                    const metadata = alertMetadataMap[alertKey] || {};
                    return {
                        alert: alert.alert,
                        exists: alert.exists,
                        severity: alert.severity,
                        documentUrl: alert.documentUrl,
                        lastUpdatedDate: alert.lastUpdatedDate,
                        alertName: metadata.AlertName || alert.alert,
                        description: metadata.Description || ""
                    };
                }) || [],
            googleInfo: {
                rating: company.googleRating,
                ratingCount: company.googleRatingCount,
                location: {
                    latitude: company.latitude,
                    longitude: company.longitude
                },
                thumbnailUrl: company.thumbnailUrl,
                website: company.website,
                businessType: company.businessType
            }
        };
        console.log("alertCount : ", templateData.alertCount);

        const compiledTemplate = Handlebars.compile(template);
        let html = compiledTemplate(templateData);
        html = html.replace('</head>', `<style>${cssContent}</style></head>`);
        html = html.replace('</body>', `<script>${jsContent}</script></body>`);

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().includes('../assets/')) {
                const newUrl = request.url().replace(
                    '../assets/',
                    `file://${path.join(__dirname, '../assets/')}`
                );
                request.continue({ url: newUrl });
            } else {
                request.continue();
            }
        });

        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px"
            }
        });

        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${company.name?.replace(/[^a-z0-9]/gi, "_") || "report"}.pdf"`
        );

        // Save PDF locally
        const outputDir = path.join(__dirname, '../assets/reports');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, `${company.name?.replace(/[^a-z0-9]/gi, "_") || "report"}.pdf`);
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log('PDF saved locally at:', outputPath);

        res.send(pdfBuffer);
    } catch (error) {
        console.error("Download error:", error);
        res.status(500).send("Server error while generating PDF.");
    }
}

module.exports = { downloadPdf };