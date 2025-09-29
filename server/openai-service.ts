async generateDetailedProject(
  request: ProjectGenerationRequest
): Promise<Omit<InsertMicroProject, 'id' | 'createdAt' | 'updatedAt'>> {
  const prompt = `You are an expert career coach. The user is a ${request.userBackground} who wants to become a ${request.targetRole}. Their resume analysis shows they lack "${request.skillGap}" skills.

Create a detailed practice project with specific exercises that will help them demonstrate this skill on their resume. Focus on:
- Concrete, actionable steps they can complete 
- Real deliverables they can add to their portfolio
- Specific scenarios relevant to ${request.targetRole} role
- Measurable outcomes they can quantify on their resume

Return JSON in this exact schema (do not rename keys):

{
  "title": "string",
  "description": "string", 
  "targetSkill": "string",
  "skillCategory": "string",
  "difficulty": "${request.difficultyLevel}",
  "estimatedHours": number,
  "projectType": "design|development|research|analysis",
  "instructions": { ... },
  "deliverables": ["string"],
  "evaluationCriteria": ["string"],
  "exampleArtifacts": ["string"],
  "tags": ["string"]
}`;

  try {
    console.log('Starting OpenAI request for project generation...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Return ONLY valid JSON with no markdown formatting or extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500
    }, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('OpenAI response received successfully');
    
    let content = response.choices[0].message.content || '{}';
    console.log('Raw OpenAI response:', content.length > 200 ? 
      `${content.substring(0, 200)}...` : content);
    
    // Enhanced JSON parsing
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error('Invalid JSON response - missing boundaries');
    }
    
    content = content
      .slice(jsonStart, jsonEnd + 1)
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    if (content.startsWith('json\n')) {
      content = content.substring(5);
    }
    
    let projectData;
    try {
      projectData = JSON.parse(content);

      // 🔑 Normalize alternate key names
      if (!projectData.title && projectData.projectTitle) {
        projectData.title = projectData.projectTitle;
      }
      if (!projectData.difficultyLevel && projectData.difficulty) {
        projectData.difficultyLevel = projectData.difficulty;
      }
      if (!projectData.skillCategory && projectData.category) {
        projectData.skillCategory = projectData.category;
      }

      if (!projectData.title || typeof projectData.title !== 'string') {
        throw new Error('Missing or invalid title in response');
      }
      
    } catch (parseError) {
      console.error('JSON parse failed:', {
        error: parseError,
        content: content.length > 200 ? 
          `${content.substring(0, 200)}...` : content
      });
      
      projectData = {
        title: `${request.skillGap} Practice Project`,
        description: `Develop ${request.skillGap} skills through hands-on exercises`,
        targetSkill: request.skillGap,
        difficulty: request.difficultyLevel,
        estimatedHours: 12,
        instructions: [
          `Research ${request.skillGap} requirements for ${request.targetRole}`,
          `Create a practical example demonstrating these skills`,
          `Document your process and results`
        ],
        deliverables: [
          `Completed ${request.skillGap} project`,
          `Documentation of your approach`
        ],
        evaluationCriteria: [
          "Demonstrates core competencies",
          "Includes measurable outcomes"
        ],
        tags: [request.skillGap.toLowerCase()]
      };
    }
    
    return {
      title: projectData.title,
      description: projectData.description,
      targetSkill: projectData.targetSkill || request.skillGap,
      skillCategory: projectData.skillCategory || request.skillCategory,
      difficultyLevel: projectData.difficultyLevel || request.difficultyLevel,
      estimatedHours: projectData.estimatedHours || 12,
      projectType: projectData.projectType || this.getProjectType(request.skillCategory),
      instructions: projectData.instructions,
      deliverables: projectData.deliverables || [],
      evaluationCriteria: projectData.evaluationCriteria || [],
      exampleArtifacts: projectData.exampleArtifacts || [],
      datasetUrl: null,
      tags: projectData.tags || [request.skillGap.toLowerCase()],
      isActive: true
    };
  } catch (error) {
    console.error("Error generating project with OpenAI:", error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenAI request timed out after 45 seconds');
    }
    throw new Error(`Failed to generate AI-powered project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

