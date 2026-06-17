import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ServiceCategory, IServiceCategory } from '../modules/services/models/ServiceCategory';
import { SubService, PricingType } from '../modules/services/models/SubService';
import { Logger } from '../config/logger';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:password123@localhost:27017/oddigo?authSource=admin';

interface SubServiceData {
    name: string;
    slug: string;
    basePrice: number;
    estimatedTime: number;
    pricingType: PricingType;
    description: string;
}

interface CategoryData {
    name: string;
    slug: string;
    icon: string;
    description: string;
    subServices: SubServiceData[];
}

const categories: CategoryData[] = [
    {
        name: 'Plumbing',
        slug: 'plumbing',
        icon: '🔧',
        description: 'All plumbing services including repairs, installations, and maintenance',
        subServices: [
            { name: 'Water Leakage', slug: 'water-leakage', basePrice: 299, estimatedTime: 60, pricingType: PricingType.ESTIMATE, description: 'Detect and fix water leaks' },
            { name: 'Tap Repair', slug: 'tap-repair', basePrice: 199, estimatedTime: 30, pricingType: PricingType.ESTIMATE, description: 'Fix dripping or non-functional taps' },
            { name: 'Toilet Repair', slug: 'toilet-repair', basePrice: 349, estimatedTime: 45, pricingType: PricingType.ESTIMATE, description: 'Fix flushing issues and leaks' },
            { name: 'Pipe Replacement', slug: 'pipe-replacement', basePrice: 499, estimatedTime: 90, pricingType: PricingType.ESTIMATE, description: 'Replace damaged or corroded pipes' },
            { name: 'Water Tank Issues', slug: 'water-tank-issues', basePrice: 399, estimatedTime: 60, pricingType: PricingType.ESTIMATE, description: 'Tank cleaning and valve repair' },
            { name: 'Drain Blockage', slug: 'drain-blockage', basePrice: 249, estimatedTime: 45, pricingType: PricingType.ESTIMATE, description: 'Clear blocked drains' }
        ]
    },
    {
        name: 'Electrical Appliances',
        slug: 'electrical-appliances',
        icon: '⚡',
        description: 'Electrical repair and installation services',
        subServices: [
            { name: 'Switch Repair', slug: 'switch-repair', basePrice: 149, estimatedTime: 20, pricingType: PricingType.ESTIMATE, description: 'Replace or fix faulty switches' },
            { name: 'Fan Repair', slug: 'fan-repair', basePrice: 299, estimatedTime: 45, pricingType: PricingType.ESTIMATE, description: 'Fix speed, noise, and wiring issues' },
            { name: 'Wiring Issues', slug: 'wiring-issues', basePrice: 499, estimatedTime: 90, pricingType: PricingType.ESTIMATE, description: 'Rewiring and loose connection fixes' },
            { name: 'MCB Replacement', slug: 'mcb-replacement', basePrice: 199, estimatedTime: 20, pricingType: PricingType.ESTIMATE, description: 'Replace tripped or blown MCBs' },
            { name: 'Power Outage Troubleshooting', slug: 'power-outage-troubleshooting', basePrice: 349, estimatedTime: 60, pricingType: PricingType.ESTIMATE, description: 'Diagnose power issues' },
            { name: 'Inverter Connection', slug: 'inverter-connection', basePrice: 599, estimatedTime: 90, pricingType: PricingType.ESTIMATE, description: 'Setup or repair inverter wiring' },
            { name: 'Socket Installation', slug: 'socket-installation', basePrice: 249, estimatedTime: 30, pricingType: PricingType.ESTIMATE, description: 'Install new power sockets' },
            { name: 'Short Circuit Repair', slug: 'short-circuit-repair', basePrice: 449, estimatedTime: 60, pricingType: PricingType.ESTIMATE, description: 'Fix short circuit problems' },
            { name: 'Washing Machine Repair', slug: 'washing-machine-repair', basePrice: 599, estimatedTime: 90, pricingType: PricingType.ESTIMATE, description: 'Motor, spin, and water issues' }
        ]
    },
    {
        name: 'AC Technician',
        slug: 'ac-technician',
        icon: '❄️',
        description: 'Air conditioning repair, maintenance, and installation',
        subServices: [
            { name: 'AC Servicing', slug: 'ac-servicing', basePrice: 599, estimatedTime: 60, pricingType: PricingType.FIXED, description: 'Regular maintenance and cleaning' },
            { name: 'Gas Refill', slug: 'gas-refill', basePrice: 1499, estimatedTime: 45, pricingType: PricingType.ESTIMATE, description: 'Recharge AC gas' },
            { name: 'AC Installation', slug: 'ac-installation', basePrice: 1999, estimatedTime: 120, pricingType: PricingType.FIXED, description: 'New AC setup' },
            { name: 'AC Uninstallation', slug: 'ac-uninstallation', basePrice: 799, estimatedTime: 60, pricingType: PricingType.FIXED, description: 'Remove existing AC' },
            { name: 'Cooling Issue', slug: 'cooling-issue', basePrice: 499, estimatedTime: 60, pricingType: PricingType.ESTIMATE, description: 'Diagnose cooling problems' },
            { name: 'AC Water Leakage', slug: 'ac-water-leakage', basePrice: 399, estimatedTime: 45, pricingType: PricingType.ESTIMATE, description: 'Fix AC water dripping' },
            { name: 'PCB Repair', slug: 'pcb-repair', basePrice: 1299, estimatedTime: 90, pricingType: PricingType.ESTIMATE, description: 'Replace or repair AC circuit board' }
        ]
    },
    {
        name: 'Vehicle Services at Home',
        slug: 'vehicle-services',
        icon: '🚗',
        description: 'Vehicle repair and maintenance services at your doorstep',
        subServices: [
            { name: 'Bike Mechanic', slug: 'bike-mechanic', basePrice: 399, estimatedTime: 60, pricingType: PricingType.ESTIMATE, description: 'Two-wheeler repairs at home' },
            { name: 'Car Mechanic', slug: 'car-mechanic', basePrice: 799, estimatedTime: 90, pricingType: PricingType.ESTIMATE, description: 'Four-wheeler repairs at home' },
            { name: 'Puncture Repair', slug: 'puncture-repair', basePrice: 199, estimatedTime: 30, pricingType: PricingType.FIXED, description: 'Tyre puncture fix' },
            { name: 'Battery Replacement', slug: 'battery-replacement', basePrice: 599, estimatedTime: 20, pricingType: PricingType.ESTIMATE, description: 'Vehicle battery swap' },
            { name: 'Car Wash', slug: 'car-wash', basePrice: 499, estimatedTime: 45, pricingType: PricingType.FIXED, description: 'On-site car washing' }
        ]
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        Logger.info('Connected to MongoDB for seeding');

        await ServiceCategory.deleteMany({});
        await SubService.deleteMany({});
        Logger.info('Cleared existing service data');

        for (const categoryData of categories) {
            const category = await ServiceCategory.create({
                name: categoryData.name,
                slug: categoryData.slug,
                icon: categoryData.icon,
                description: categoryData.description,
                isActive: true
            });

            Logger.info(`Created category: ${category.name}`);

            for (const subData of categoryData.subServices) {
                await SubService.create({
                    name: subData.name,
                    slug: subData.slug,
                    category: category._id,
                    description: subData.description,
                    basePrice: subData.basePrice,
                    estimatedTime: subData.estimatedTime,
                    pricingType: subData.pricingType,
                    isActive: true
                });

                Logger.info(`  Created sub-service: ${subData.name} (₹${subData.basePrice})`);
            }
        }

        const categoryCount = await ServiceCategory.countDocuments();
        const subServiceCount = await SubService.countDocuments();

        Logger.info(`Seeding complete: ${categoryCount} categories, ${subServiceCount} sub-services`);

        process.exit(0);
    } catch (error: any) {
        Logger.error(`Seeding failed: ${error.message}`);
        process.exit(1);
    }
}

seedDatabase();
