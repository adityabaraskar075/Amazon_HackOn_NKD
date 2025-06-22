import type { TransactionGraph, RiskAssessment } from '@/types';

// This is a simplified mock. A real GNN would be much more complex.
export function mockGnnPrediction(graph: TransactionGraph): Omit<RiskAssessment, 'summary' | 'isHighRisk'> {
  let riskScore = Math.random() * 0.2; // Base risk, start lower
  const riskFactors: string[] = [];
  let fraudProofHash: string | undefined = undefined;

  if (!graph || !graph.nodes || !graph.edges) {
    riskFactors.push("Invalid graph data provided.");
    return { riskScore: 0.9, riskFactors }; // Penalize heavily for bad data
  }
  
  const merchantNode = graph.nodes.find(n => n.type === 'merchant');
  if (merchantNode?.properties?.name === 'FastPay Services (UPI@fast123)' || merchantNode?.id === 'merchant-fastpay123') {
     // Specific scenario for Riya
    riskScore = 0.92; // Force high risk for demo
    riskFactors.push("Suspicious refund patterns");
    riskFactors.push("Multiple banned users using the same IP");
    riskFactors.push("Device reuse detected across 40 accounts");
    fraudProofHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`; // Mock hash
  } else {
    if (graph.nodes.length > 5 && graph.nodes.length <=10) {
      riskScore += 0.1;
      riskFactors.push("Moderate number of entities involved.");
    } else if (graph.nodes.length > 10) {
      riskScore += 0.2;
      riskFactors.push("Large number of entities involved.");
    }

    if (graph.edges.length > 7 && graph.edges.length <= 15) {
      riskScore += 0.1;
      riskFactors.push("Moderate volume of transactions or connections.");
    } else if (graph.edges.length > 15) {
      riskScore += 0.25;
      riskFactors.push("High volume of transactions or connections.");
    }
    
    const transactionAmounts = graph.edges.filter(edge => edge.type === 'transaction' && typeof edge.amount === 'number').map(edge => edge.amount!);
    if (transactionAmounts.length > 0) {
      const mainTransactionAmount = transactionAmounts[0]; // Assuming the first transaction is the primary one for this simplified model
      if (mainTransactionAmount > 1000 && mainTransactionAmount <= 5000) {
        riskScore += 0.15;
        riskFactors.push("High transaction amount.");
      } else if (mainTransactionAmount > 5000) {
        riskScore += 0.3;
        riskFactors.push("Very high transaction amount.");
      }
    }

    const ipNode = graph.nodes.find(n => n.type === 'ip_address');
    if (ipNode?.properties?.reuseCount && ipNode.properties.reuseCount > 5) {
        riskScore += 0.2;
        riskFactors.push(`IP address ${ipNode.properties.address} shows high reuse (${ipNode.properties.reuseCount} times).`);
    }
    
    const deviceNode = graph.nodes.find(n => n.type === 'device');
    if (deviceNode?.properties?.reuseCount && deviceNode.properties.reuseCount > 10) {
        riskScore += 0.25;
        riskFactors.push(`Device ID ${deviceNode.id} shows high reuse (${deviceNode.properties.reuseCount} times).`);
    }

    if (graph.edges.some(edge => edge.properties?.isFlagged === true)) {
      riskScore += 0.3;
      riskFactors.push("Associated entity explicitly flagged as suspicious.");
    }
  }


  riskScore = Math.min(riskScore, 1.0);
  riskScore = Math.max(riskScore, 0.0);

  if (riskScore >= 0.7 && !fraudProofHash) {
     fraudProofHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }


  if (riskFactors.length === 0 && riskScore < 0.7) { // Only add default if not Riya's scenario
    if (riskScore < 0.1) {
       riskFactors.push("Transaction patterns appear normal.");
    } else {
       riskFactors.push("Minor irregularities detected, overall risk low.");
    }
  } else if (riskFactors.length === 0 && riskScore >= 0.7) {
     riskFactors.push("General suspicious activity detected based on GNN model.");
  }


  return { riskScore, riskFactors, fraudProofHash };
}
