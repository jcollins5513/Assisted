export interface ConversationAnalysis {
  tone: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keyTopics: string[];
  objections: string[];
  closingAttempts: number;
  negotiationPhases: string[];
  overallScore: number;
  feedback: string[];
  timestamp: number;
  salesTechniques: string[];
  scenarioProgress: number;
  customerEngagement: number;
}

export interface AnalysisResult {
  transcript: string;
  analysis: ConversationAnalysis;
  realTimeFeedback: string[];
  suggestions: string[];
}

export class ConversationAnalysisService {
  private conversationBuffer: string[] = [];
  private analysisHistory: ConversationAnalysis[] = [];
  private objectionKeywords: string[] = [
    'too expensive', "can't afford", 'not interested', 'need to think',
    'compare prices', 'better deal', 'discount', 'negotiate', 'price',
    'cost', 'budget', 'expensive', 'cheaper', 'deal', 'offer'
  ];
  private closingKeywords: string[] = [
    'buy', 'purchase', 'sign', 'deal', 'close', 'today', 'now',
    'ready', 'decision', 'commit', 'proceed', 'go ahead'
  ];
  private positiveKeywords: string[] = [
    'great', 'excellent', 'perfect', 'love', 'like', 'good', 'nice',
    'amazing', 'wonderful', 'fantastic', 'awesome', 'impressive'
  ];
  private negativeKeywords: string[] = [
    'bad', 'terrible', 'awful', 'hate', 'dislike', 'worst', 'poor',
    'disappointing', 'frustrated', 'angry', 'upset', 'annoyed'
  ];
  private salesTechniqueKeywords: Record<string, string[]> = {
    'feel_felt_found': ['feel', 'felt', 'found', 'understand', 'concern'],
    'assumptive_close': ['when you', 'once you', 'after you', 'assuming'],
    'trial_close': ['if we could', 'would you be', 'does that work', 'sound good'],
    'urgency_creation': ['limited time', 'last one', 'special offer', 'today only'],
    'value_proposition': ['value', 'worth', 'benefit', 'advantage', 'feature'],
    'needs_assessment': ['what are you', 'tell me about', 'looking for', 'need'],
    'rapport_building': ['family', 'work', 'hobby', 'interest', 'background'],
    'objection_handling': ['however', 'but', 'although', 'despite', 'while'],
    'benefit_stacking': ['also', 'plus', 'additionally', 'moreover', 'furthermore'],
    'social_proof': ['other customers', 'people say', 'reviews', 'testimonials']
  };
  private scenarioKeywords: Record<string, { objectives: string[]; keywords: string[]; success_indicators: string[] } > = {
    'price-objection': {
      objectives: ['Address price concerns', 'Highlight value proposition', 'Use "Feel, Felt, Found" technique'],
      keywords: ['price', 'expensive', 'cost', 'budget', 'value', 'worth', 'deal'],
      success_indicators: ['value proposition', 'benefits', 'investment', 'savings']
    },
    'trade-in-negotiation': {
      objectives: ['Justify trade-in value', 'Show market comparison', 'Create win-win solution'],
      keywords: ['trade', 'trade-in', 'value', 'market', 'comparison', 'fair'],
      success_indicators: ['market value', 'fair price', 'win-win', 'agreement']
    },
    'financing-concerns': {
      objectives: ['Build confidence', 'Explain process', 'Offer alternatives'],
      keywords: ['finance', 'credit', 'approval', 'payment', 'monthly', 'interest'],
      success_indicators: ['confidence', 'process', 'options', 'approved']
    },
    'feature-comparison': {
      objectives: ['Highlight unique features', 'Demonstrate value', 'Close with confidence'],
      keywords: ['feature', 'compare', 'competitor', 'better', 'advantage', 'unique'],
      success_indicators: ['unique', 'advantage', 'better', 'superior']
    }
  };

  analyzeConversation(transcript: string, scenario?: string): AnalysisResult {
    this.conversationBuffer.push(transcript);
    if (this.conversationBuffer.length > 10) this.conversationBuffer.shift();
    const analysis = this.performAnalysis(transcript, scenario);
    this.analysisHistory.push(analysis);
    const realTimeFeedback = this.generateRealTimeFeedback(analysis, scenario);
    const suggestions = this.generateSuggestions(analysis, scenario);
    return { transcript, analysis, realTimeFeedback, suggestions };
  }

  private performAnalysis(transcript: string, scenario?: string): ConversationAnalysis {
    const lower = transcript.toLowerCase();
    const tone = this.analyzeTone(lower);
    const confidence = this.calculateConfidence(lower);
    const keyTopics = this.extractKeyTopics(lower);
    const objections = this.detectObjections(lower);
    const closingAttempts = this.detectClosingAttempts(lower);
    const negotiationPhases = this.identifyNegotiationPhases(lower);
    const salesTechniques = this.detectSalesTechniques(lower);
    const scenarioProgress = this.calculateScenarioProgress(lower, scenario);
    const customerEngagement = this.calculateCustomerEngagement(lower);
    const overallScore = this.calculateOverallScore({
      tone,
      confidence,
      objections: objections.length,
      closingAttempts,
      negotiationPhases: negotiationPhases.length,
      salesTechniques: salesTechniques.length,
      scenarioProgress,
      customerEngagement,
    });
    const feedback = this.generateFeedback({ tone, objections, closingAttempts, overallScore, salesTechniques, scenario });
    return {
      tone,
      confidence,
      keyTopics,
      objections,
      closingAttempts,
      negotiationPhases,
      overallScore,
      feedback,
      timestamp: Date.now(),
      salesTechniques,
      scenarioProgress,
      customerEngagement,
    };
  }

  private analyzeTone(t: string): 'positive' | 'neutral' | 'negative' {
    const pos = this.countKeywords(t, this.positiveKeywords);
    const neg = this.countKeywords(t, this.negativeKeywords);
    if (pos > neg && pos > 0) return 'positive';
    if (neg > pos && neg > 0) return 'negative';
    return 'neutral';
  }
  private calculateConfidence(t: string): number {
    const wordCount = t.split(' ').length;
    const hasObj = this.detectObjections(t).length > 0;
    const hasClose = this.detectClosingAttempts(t) > 0;
    const techniques = this.detectSalesTechniques(t);
    let conf = Math.min(wordCount / 50, 1);
    if (hasObj) conf += 0.2;
    if (hasClose) conf += 0.3;
    if (techniques.length > 0) conf += 0.2;
    return Math.min(conf, 1);
  }
  private extractKeyTopics(t: string): string[] {
    const topics: string[] = [];
    const words = t.split(' ');
    const carTerms = ['car', 'vehicle', 'model', 'make', 'year', 'price', 'payment', 'financing'];
    const featureTerms = ['feature', 'option', 'package', 'trim', 'engine', 'transmission'];
    const salesTerms = ['deal', 'offer', 'discount', 'trade', 'financing', 'warranty'];
    for (const w of words) {
      if (carTerms.includes(w) || featureTerms.includes(w) || salesTerms.includes(w)) topics.push(w);
    }
    return [...new Set(topics)];
  }
  private detectObjections(t: string): string[] {
    const res: string[] = [];
    for (const k of this.objectionKeywords) if (t.includes(k)) res.push(k);
    return res;
  }
  private detectClosingAttempts(t: string): number {
    let attempts = 0;
    for (const k of this.closingKeywords) if (t.includes(k)) attempts++;
    return attempts;
  }
  private identifyNegotiationPhases(t: string): string[] {
    const phases: string[] = [];
    if (t.includes('introduce') || t.includes('meet') || t.includes('hello')) phases.push('introduction');
    if (t.includes('need') || t.includes('looking') || t.includes('want')) phases.push('needs-assessment');
    if (t.includes('feature') || t.includes('benefit') || t.includes('show')) phases.push('presentation');
    if (this.detectObjections(t).length > 0) phases.push('objection-handling');
    if (this.detectClosingAttempts(t) > 0) phases.push('closing');
    if (t.includes('follow') || t.includes('call') || t.includes('contact')) phases.push('follow-up');
    return [...new Set(phases)];
  }
  private detectSalesTechniques(t: string): string[] {
    const techniques: string[] = [];
    for (const [tech, keywords] of Object.entries(this.salesTechniqueKeywords)) {
      let c = 0; for (const k of keywords) if (t.includes(k)) c++;
      if (c >= 2) techniques.push(tech.replace('_', ' '));
    }
    return techniques;
  }
  private calculateScenarioProgress(t: string, scenario?: string): number {
    if (!scenario || !this.scenarioKeywords[scenario]) return 0;
    const data = this.scenarioKeywords[scenario];
    let keywordMatches = 0; for (const k of data.keywords) if (t.includes(k)) keywordMatches++;
    let successIndicators = 0; for (const s of data.success_indicators) if (t.includes(s)) successIndicators++;
    const keywordProgress = Math.min(keywordMatches / data.keywords.length, 1);
    const successProgress = Math.min(successIndicators / data.success_indicators.length, 1);
    return Math.round((keywordProgress * 0.6 + successProgress * 0.4) * 100);
  }
  private calculateCustomerEngagement(t: string): number {
    const indicators = ['yes', 'no', 'maybe', 'tell me', 'how', 'what', 'why', 'when', 'where', 'interested', 'like', 'love', 'hate', 'think', 'feel', 'believe'];
    let score = 0; for (const w of t.split(' ')) if (indicators.includes(w)) score++;
    return Math.min(score * 10, 100);
  }
  private calculateOverallScore(m: { tone: string; confidence: number; objections: number; closingAttempts: number; negotiationPhases: number; salesTechniques: number; scenarioProgress: number; customerEngagement: number; }): number {
    let score = 50;
    if (m.tone === 'positive') score += 20; else if (m.tone === 'negative') score -= 20;
    score += m.confidence * 15;
    if (m.objections > 0 && m.objections <= 3) score += 10; else if (m.objections > 3) score -= 10;
    score += Math.min(m.closingAttempts * 5, 15);
    score += Math.min(m.negotiationPhases * 5, 20);
    score += Math.min(m.salesTechniques * 8, 20);
    score += m.scenarioProgress * 0.2;
    score += m.customerEngagement * 0.1;
    return Math.max(0, Math.min(100, score));
  }
  private generateFeedback(a: { tone: string; objections: string[]; closingAttempts: number; overallScore: number; salesTechniques: string[]; scenario?: string; }): string[] {
    const fb: string[] = [];
    if (a.tone === 'negative') fb.push('Consider using more positive language to build rapport');
    if (a.objections.length > 0) fb.push(`Address the ${a.objections.length} objection(s) with empathy and solutions`);
    if (a.closingAttempts === 0) fb.push('Look for opportunities to ask for the sale');
    if (a.overallScore < 60) fb.push('Focus on building trust and understanding customer needs');
    if (a.salesTechniques.length === 0) fb.push('Try incorporating proven sales techniques like "Feel, Felt, Found"');
    if (a.scenario) {
      const data = this.scenarioKeywords[a.scenario];
      if (data) fb.push(`Focus on scenario objectives: ${data.objectives.join(', ')}`);
    }
    return fb;
  }
  private generateRealTimeFeedback(a: ConversationAnalysis, scenario?: string): string[] {
    const fb: string[] = [];
    if (a.tone === 'negative') fb.push('⚠️ Customer seems concerned - focus on addressing their worries');
    if (a.objections.length > 0) fb.push(`🎯 Objection detected: "${a.objections[0]}" - address with empathy`);
    if (a.closingAttempts > 0) fb.push('✅ Closing attempt detected - good sales technique!');
    if (a.salesTechniques.length > 0) fb.push(`💡 Sales technique detected: ${a.salesTechniques[0]} - excellent!`);
    if (a.customerEngagement > 70) fb.push('🎉 High customer engagement - keep the momentum!');
    if (scenario && a.scenarioProgress > 50) fb.push(`📈 Good progress on scenario objectives (${a.scenarioProgress}%)`);
    return fb;
  }
}

export const conversationAnalysisService = new ConversationAnalysisService();


