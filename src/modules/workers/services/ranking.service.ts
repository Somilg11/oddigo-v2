/**
 * Wilson Score Interval Calculation
 * Used for ranking workers based on positive vs negative ratings.
 * 
 * Formula:
 * ( (p + z²/2n) - z * sqrt( (p(1-p) + z²/4n) / n ) ) / (1 + z²/n)
 * 
 * p = positive ratings / total ratings
 * n = total ratings
 * z = 1.96 (for 95% confidence)
 */

export class RankingService {

    private static readonly Z_SCORE = 1.96; // 95% Confidence

    /**
     * Calculates the lower bound of the Wilson Score confidence interval.
     * @param positive number of positive ratings (e.g., 4 or 5 stars)
     * @param total total number of ratings
     * @returns score between 0 and 1
     */
    static calculateWilsonScore(positive: number, total: number): number {
        if (total === 0) return 0;

        const p = positive / total;
        const n = total;
        const z = this.Z_SCORE;

        const numerator = p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
        const denominator = 1 + (z * z) / n;

        return numerator / denominator;
    }

    /**
     * Updates reliability score based on on-time arrivals vs total jobs.
     * Simple ratio for now, could be exponential moving average later.
     */
    static calculateReliabilityScore(onTimeJobs: number, totalJobs: number): number {
        if (totalJobs === 0) return 1; // New workers start with high trust? Or neutral?
        // Let's settle on Neutral 0.5 or 1.0 depending on policy. 
        // LLD says "reliability_score", let's return ratio.
        return onTimeJobs / totalJobs;
    }
}
