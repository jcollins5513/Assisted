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
  private currentPhase: string = 'introduction';
  private objectionKeywords: string[] = [
    'too expensive', 'can\'t afford', 'not interested', 'need to think',
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

  private salesTechniqueKeywords: {
    [key: string]: string[];
  } = {
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

  private scenarioKeywords: {
    [key: string]: {
      objectives: string[];
      keywords: string[];
      success_indicators: string[];
    };
  } = {
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

  // Analyze real-time conversation
  analyzeConversation(transcript: string, scenario?: string): AnalysisResult {
    // Add to buffer
    this.conversationBuffer.push(transcript);
    
    // Keep only last 10 entries for context
    if (this.conversationBuffer.length > 10) {
      this.conversationBuffer.shift();
    }

    // Perform analysis
    const analysis = this.performAnalysis(transcript, scenario);
    
    // Update history
    this.analysisHistory.push(analysis);
    
    // Generate real-time feedback
    const realTimeFeedback = this.generateRealTimeFeedback(analysis, scenario);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(analysis, scenario);

    return {
      transcript,
      analysis,
      realTimeFeedback,
      suggestions,
    };
  }

  // Perform comprehensive analysis
  private performAnalysis(transcript: string, scenario?: string): ConversationAnalysis {
    const lowerTranscript = transcript.toLowerCase();
    
    // Tone analysis
    const tone = this.analyzeTone(lowerTranscript);
    
    // Confidence scoring
    const confidence = this.calculateConfidence(lowerTranscript);
    
    // Key topics extraction
    const keyTopics = this.extractKeyTopics(lowerTranscript);
    
    // Objection detection
    const objections = this.detectObjections(lowerTranscript);
    
    // Closing attempts
    const closingAttempts = this.detectClosingAttempts(lowerTranscript);
    
    // Negotiation phases
    const negotiationPhases = this.identifyNegotiationPhases(lowerTranscript);
    
    // Sales techniques detection
    const salesTechniques = this.detectSalesTechniques(lowerTranscript);
    
    // Scenario progress
    const scenarioProgress = this.calculateScenarioProgress(lowerTranscript, scenario);
    
    // Customer engagement
    const customerEngagement = this.calculateCustomerEngagement(lowerTranscript);
    
    // Overall score
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
    
    // Generate feedback
    const feedback = this.generateFeedback({
      tone,
      objections,
      closingAttempts,
      overallScore,
      salesTechniques,
      scenario,
    });

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

  // Analyze tone
  private analyzeTone(transcript: string): 'positive' | 'neutral' | 'negative' {
    const positiveCount = this.countKeywords(transcript, this.positiveKeywords);
    const negativeCount = this.countKeywords(transcript, this.negativeKeywords);
    
    if (positiveCount > negativeCount && positiveCount > 0) {
      return 'positive';
    } else if (negativeCount > positiveCount && negativeCount > 0) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  // Calculate confidence
  private calculateConfidence(transcript: string): number {
    const wordCount = transcript.split(' ').length;
    const hasObjections = this.detectObjections(transcript).length > 0;
    const hasClosingAttempts = this.detectClosingAttempts(transcript) > 0;
    const salesTechniques = this.detectSalesTechniques(transcript);
    
    // Base confidence on conversation length and engagement
    let confidence = Math.min(wordCount / 50, 1); // Max confidence at 50 words
    
    // Adjust based on conversation quality indicators
    if (hasObjections) confidence += 0.2;
    if (hasClosingAttempts) confidence += 0.3;
    if (salesTechniques.length > 0) confidence += 0.2;
    
    return Math.min(confidence, 1);
  }

  // Extract key topics
  private extractKeyTopics(transcript: string): string[] {
    const topics: string[] = [];
    const words = transcript.split(' ');
    
    // Simple topic extraction based on common car sales terms
    const carTerms = ['car', 'vehicle', 'model', 'make', 'year', 'price', 'payment', 'financing'];
    const featureTerms = ['feature', 'option', 'package', 'trim', 'engine', 'transmission'];
    const salesTerms = ['deal', 'offer', 'discount', 'trade', 'financing', 'warranty'];
    
    for (const word of words) {
      if (carTerms.includes(word) || featureTerms.includes(word) || salesTerms.includes(word)) {
        topics.push(word);
      }
    }
    
    return [...new Set(topics)]; // Remove duplicates
  }

  // Detect objections
  private detectObjections(transcript: string): string[] {
    const objections: string[] = [];
    
    for (const keyword of this.objectionKeywords) {
      if (transcript.includes(keyword)) {
        objections.push(keyword);
      }
    }
    
    return objections;
  }

  // Detect closing attempts
  private detectClosingAttempts(transcript: string): number {
    let attempts = 0;
    
    for (const keyword of this.closingKeywords) {
      if (transcript.includes(keyword)) {
        attempts++;
      }
    }
    
    return attempts;
  }

  // Identify negotiation phases
  private identifyNegotiationPhases(transcript: string): string[] {
    const phases: string[] = [];
    
    // Enhanced phase detection based on keywords and context
    if (transcript.includes('introduce') || transcript.includes('meet') || transcript.includes('hello')) {
      phases.push('introduction');
    }
    
    if (transcript.includes('need') || transcript.includes('looking') || transcript.includes('want')) {
      phases.push('needs-assessment');
    }
    
    if (transcript.includes('feature') || transcript.includes('benefit') || transcript.includes('show')) {
      phases.push('presentation');
    }
    
    if (this.detectObjections(transcript).length > 0) {
      phases.push('objection-handling');
    }
    
    if (this.detectClosingAttempts(transcript) > 0) {
      phases.push('closing');
    }
    
    if (transcript.includes('follow') || transcript.includes('call') || transcript.includes('contact')) {
      phases.push('follow-up');
    }
    
    return [...new Set(phases)];
  }

  // Detect sales techniques
  private detectSalesTechniques(transcript: string): string[] {
    const techniques: string[] = [];
    
    for (const [technique, keywords] of Object.entries(this.salesTechniqueKeywords)) {
      let keywordCount = 0;
      for (const keyword of keywords) {
        if (transcript.includes(keyword)) {
          keywordCount++;
        }
      }
      
      // Require at least 2 keywords for technique detection
      if (keywordCount >= 2) {
        techniques.push(technique.replace('_', ' '));
      }
    }
    
    return techniques;
  }

  // Calculate scenario progress
  private calculateScenarioProgress(transcript: string, scenario?: string): number {
    if (!scenario || !this.scenarioKeywords[scenario]) {
      return 0;
    }
    
    const scenarioData = this.scenarioKeywords[scenario];
    const transcriptWords = transcript.toLowerCase().split(' ');
    
    let objectiveProgress = 0;
    let keywordMatches = 0;
    
    // Check for scenario-specific keywords
    for (const keyword of scenarioData.keywords) {
      if (transcript.includes(keyword)) {
        keywordMatches++;
      }
    }
    
    // Check for success indicators
    let successIndicators = 0;
    for (const indicator of scenarioData.success_indicators) {
      if (transcript.includes(indicator)) {
        successIndicators++;
      }
    }
    
    // Calculate progress based on keywords and success indicators
    const keywordProgress = Math.min(keywordMatches / scenarioData.keywords.length, 1);
    const successProgress = Math.min(successIndicators / scenarioData.success_indicators.length, 1);
    
    return Math.round((keywordProgress * 0.6 + successProgress * 0.4) * 100);
  }

  // Calculate customer engagement
  private calculateCustomerEngagement(transcript: string): number {
    const engagementIndicators = [
      'yes', 'no', 'maybe', 'tell me', 'how', 'what', 'why', 'when', 'where',
      'interested', 'like', 'love', 'hate', 'think', 'feel', 'believe'
    ];
    
    let engagementScore = 0;
    const words = transcript.toLowerCase().split(' ');
    
    for (const word of words) {
      if (engagementIndicators.includes(word)) {
        engagementScore++;
      }
    }
    
    // Normalize to 0-100 scale
    return Math.min(engagementScore * 10, 100);
  }

  // Calculate overall score
  private calculateOverallScore(metrics: {
    tone: string;
    confidence: number;
    objections: number;
    closingAttempts: number;
    negotiationPhases: number;
    salesTechniques: number;
    scenarioProgress: number;
    customerEngagement: number;
  }): number {
    let score = 50; // Base score
    
    // Tone adjustment
    if (metrics.tone === 'positive') score += 20;
    else if (metrics.tone === 'negative') score -= 20;
    
    // Confidence adjustment
    score += metrics.confidence * 15;
    
    // Objection handling (some objections are good for engagement)
    if (metrics.objections > 0 && metrics.objections <= 3) score += 10;
    else if (metrics.objections > 3) score -= 10;
    
    // Closing attempts
    score += Math.min(metrics.closingAttempts * 5, 15);
    
    // Negotiation phases (more phases = better conversation flow)
    score += Math.min(metrics.negotiationPhases * 5, 20);
    
    // Sales techniques
    score += Math.min(metrics.salesTechniques * 8, 20);
    
    // Scenario progress
    score += metrics.scenarioProgress * 0.2;
    
    // Customer engagement
    score += metrics.customerEngagement * 0.1;
    
    return Math.max(0, Math.min(100, score));
  }

  // Generate feedback
  private generateFeedback(analysis: {
    tone: string;
    objections: string[];
    closingAttempts: number;
    overallScore: number;
    salesTechniques: string[];
    scenario?: string;
  }): string[] {
    const feedback: string[] = [];
    
    if (analysis.tone === 'negative') {
      feedback.push('Consider using more positive language to build rapport');
    }
    
    if (analysis.objections.length > 0) {
      feedback.push(`Address the ${analysis.objections.length} objection(s) with empathy and solutions`);
    }
    
    if (analysis.closingAttempts === 0) {
      feedback.push('Look for opportunities to ask for the sale');
    }
    
    if (analysis.overallScore < 60) {
      feedback.push('Focus on building trust and understanding customer needs');
    }
    
    if (analysis.salesTechniques.length === 0) {
      feedback.push('Try incorporating proven sales techniques like "Feel, Felt, Found"');
    }
    
    // Scenario-specific feedback
    if (analysis.scenario) {
      const scenarioData = this.scenarioKeywords[analysis.scenario];
      if (scenarioData) {
        feedback.push(`Focus on scenario objectives: ${scenarioData.objectives.join(', ')}`);
      }
    }
    
    return feedback;
  }

  // Generate real-time feedback
  private generateRealTimeFeedback(analysis: ConversationAnalysis, scenario?: string): string[] {
    const feedback: string[] = [];
    
    // Immediate feedback based on current analysis
    if (analysis.tone === 'negative') {
      feedback.push('⚠️ Customer seems concerned - focus on addressing their worries');
    }
    
    if (analysis.objections.length > 0) {
      feedback.push(`🎯 Objection detected: "${analysis.objections[0]}" - address with empathy`);
    }
    
    if (analysis.closingAttempts > 0) {
      feedback.push('✅ Closing attempt detected - good sales technique!');
    }
    
    if (analysis.salesTechniques.length > 0) {
      feedback.push(`💡 Sales technique detected: ${analysis.salesTechniques[0]} - excellent!`);
    }
    
    if (analysis.customerEngagement > 70) {
      feedback.push('🎉 High customer engagement - keep the momentum!');
    }
    
    // Scenario-specific feedback
    if (scenario && analysis.scenarioProgress > 50) {
      feedback.push(`📈 Good progress on scenario objectives (${analysis.scenarioProgress}%)`);
    }
    
    return feedback;
  }

  // Generate suggestions
  private generateSuggestions(analysis: ConversationAnalysis, scenario?: string): string[] {
    const suggestions: string[] = [];
    
    if (analysis.tone === 'neutral') {
      suggestions.push('Ask open-ended questions to understand customer needs better');
    }
    
    if (analysis.objections.length > 0) {
      suggestions.push('Use the "Feel, Felt, Found" technique to handle objections');
    }
    
    if (analysis.closingAttempts === 0) {
      suggestions.push('Try a trial close: "If we can address your concerns, would you be ready to proceed?"');
    }
    
    if (analysis.salesTechniques.length === 0) {
      suggestions.push('Incorporate value proposition statements to highlight benefits');
    }
    
    if (analysis.customerEngagement < 30) {
      suggestions.push('Increase engagement by asking more questions and showing interest');
    }
    
    // Scenario-specific suggestions
    if (scenario && analysis.scenarioProgress < 30) {
      const scenarioData = this.scenarioKeywords[scenario];
      if (scenarioData) {
        suggestions.push(`Focus on scenario keywords: ${scenarioData.keywords.slice(0, 3).join(', ')}`);
      }
    }
    
    return suggestions;
  }

  // Count keyword occurrences
  private countKeywords(text: string, keywords: string[]): number {
    let count = 0;
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches) count += matches.length;
    }
    return count;
  }

  // Get analysis history
  getAnalysisHistory(): ConversationAnalysis[] {
    return [...this.analysisHistory];
  }

  // Get conversation buffer
  getConversationBuffer(): string[] {
    return [...this.conversationBuffer];
  }

  // Clear history
  clearHistory(): void {
    this.conversationBuffer = [];
    this.analysisHistory = [];
    this.currentPhase = 'introduction';
  }
}

// Create singleton instance
export const conversationAnalysisService = new ConversationAnalysisService();
