import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import CircularScoreChart from './CircularScoreChart';
import { calculateCreditFactors, Account } from '../utils/creditFactorsCalculator';

interface BureauScore {
  bureau: string;
  score: number;
  scoreType: string;
  date: string;
  color: string;
}

interface ScoreChartsCardProps {
  currentScores: BureauScore[];
  accounts?: Account[];
}

const ScoreChartsCard: React.FC<ScoreChartsCardProps> = ({ currentScores, accounts }) => {
  // Get unique score types from current scores for circular charts
  const getUniqueScoreTypes = (): Array<{scoreType: 'FICO' | 'VantageScore', score: number}> => {
    const scoreTypes = new Set<string>();
    const uniqueScores: Array<{scoreType: 'FICO' | 'VantageScore', score: number}> = [];
    
    currentScores.forEach(score => {
      const normalizedType = score.scoreType.toLowerCase().includes('vantage') ? 'VantageScore' : 'FICO';
      if (!scoreTypes.has(normalizedType)) {
        scoreTypes.add(normalizedType);
        uniqueScores.push({
          scoreType: normalizedType as 'FICO' | 'VantageScore',
          score: score.score
        });
      }
    });
    
    // If no scores found, default to FICO with average score
    if (uniqueScores.length === 0 && currentScores.length > 0) {
      const avgScore = Math.round(currentScores.reduce((sum, s) => sum + s.score, 0) / currentScores.length);
      uniqueScores.push({ scoreType: 'FICO', score: avgScore });
    }
    
    return uniqueScores;
  };

  const uniqueScoreTypes = getUniqueScoreTypes();

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Credit Score Analysis</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-col gap-6 flex-1 justify-center">
          {uniqueScoreTypes.map((scoreData, index) => {
            const factors = accounts ? calculateCreditFactors(accounts, scoreData.scoreType) : undefined;
            return (
              <CircularScoreChart
                key={`${scoreData.scoreType}-${index}`}
                score={scoreData.score}
                scoreType={scoreData.scoreType}
                size={280}
                creditFactors={factors}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreChartsCard;