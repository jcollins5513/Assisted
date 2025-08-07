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

  // Analyze real-time conversation
  analyzeConversation(transcript: string): AnalysisResult {
    // Add to buffer
    this.conversationBuffer.push(transcript);
    
    // Keep only last 10 entries for context
    if (this.conversationBuffer.length > 10) {
      this.conversationBuffer.shift();
    }

    // Perform analysis
    const analysis = this.performAnalysis(transcript);
    
    // Update history
    this.analysisHistory.push(analysis);
    
    // Generate real-time feedback
    const realTimeFeedback = this.generateRealTimeFeedback(analysis);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(analysis);

    return {
      transcript,
      analysis,
      realTimeFeedback,
      suggestions,
    };
  }

  // Perform comprehensive analysis
  private performAnalysis(transcript: string): ConversationAnalysis {
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
    
    // Overall score
    const overallScore = this.calculateOverallScore({
      tone,
      confidence,
      objections: objections.length,
      closingAttempts,
      negotiationPhases: negotiationPhases.length,
    });
    
    // Generate feedback
    const feedback = this.generateFeedback({
      tone,
      objections,
      closingAttempts,
      overallScore,
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
    
    // Base confidence on conversation length and engagement
    let confidence = Math.min(wordCount / 50, 1); // Max confidence at 50 words
    
    // Adjust based on conversation quality indicators
    if (hasObjections) confidence += 0.2;
    if (hasClosingAttempts) confidence += 0.3;
    
    return Math.min(confidence, 1);
  }

  // Extract key topics
  private extractKeyTopics(transcript: string): string[] {
    const topics: string[] = [];
    const words = transcript.split(' ');
    
    // Simple topic extraction based on common car sales terms
    const carTerms = ['car', 'vehicle', 'model', 'make', 'year', 'price', 'payment', 'financing'];
    const featureTerms = ['feature', 'option', 'package', 'trim', 'engine', 'transmission'];
    
    for (const word of words) {
      if (carTerms.includes(word) || featureTerms.includes(word)) {
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
    
    // Simple phase detection based on keywords
    if (transcript.includes('introduce') || transcript.includes('meet')) {
      phases.push('introduction');
    }
    
    if (transcript.includes('need') || transcript.includes('looking')) {
      phases.push('needs-assessment');
    }
    
    if (transcript.includes('feature') || transcript.includes('benefit')) {
      phases.push('presentation');
    }
    
    if (this.detectObjections(transcript).length > 0) {
      phases.push('objection-handling');
    }
    
    if (this.detectClosingAttempts(transcript) > 0) {
      phases.push('closing');
    }
    
    return [...new Set(phases)];
  }

  // Calculate overall score
  private calculateOverallScore(metrics: {
    tone: string;
    confidence: number;
    objections: number;
    closingAttempts: number;
    negotiationPhases: number;
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
    
    return Math.max(0, Math.min(100, score));
  }

  // Generate feedback
  private generateFeedback(analysis: {
    tone: string;
    objections: string[];
    closingAttempts: number;
    overallScore: number;
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
    
    return feedback;
  }

  // Generate real-time feedback
  private generateRealTimeFeedback(analysis: ConversationAnalysis): string[] {
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
    
    return feedback;
  }

  // Generate suggestions
  private generateSuggestions(analysis: ConversationAnalysis): string[] {
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
