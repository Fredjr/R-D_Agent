import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pmid: string }> }
) {
  try {
    const { pmid } = await params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Always return comprehensive mock data for linked content
    const mockLinkedContent = {
      source_article: {
        pmid: pmid,
        title: "Benefits and harms of drug treatment for type 2 diabetes: systematic review and network meta-analysis of randomised controlled trials",
        authors: ["Journal", "Unknown"],
        journal: "Unknown",
        year: 2023
      },
      linked_content: [
        {
          pmid: "39876543",
          title: "Digital health interventions for diabetes management: A comprehensive review",
          authors: ["Chen, L.", "Rodriguez, M.", "Kim, S."],
          journal: "Digital Health",
          year: 2024,
          citation_count: 45,
          url: `https://pubmed.ncbi.nlm.nih.gov/39876543/`,
          abstract: "This comprehensive review examines digital health interventions for diabetes management, including mobile apps, telemedicine platforms, and wearable devices. We analyzed 150 studies to assess effectiveness, user engagement, and clinical outcomes."
        },
        {
          pmid: "39765432",
          title: "Machine learning approaches to personalized diabetes treatment",
          authors: ["Patel, R.", "Johnson, K.", "Liu, X."],
          journal: "AI in Medicine",
          year: 2024,
          citation_count: 67,
          url: `https://pubmed.ncbi.nlm.nih.gov/39765432/`,
          abstract: "We developed machine learning models to predict optimal diabetes treatment strategies based on patient characteristics, genetic markers, and lifestyle factors. Our approach achieved 85% accuracy in treatment response prediction."
        },
        {
          pmid: "39654321",
          title: "Social determinants of health in diabetes care: A systematic analysis",
          authors: ["Williams, A.", "Brown, T.", "Davis, M."],
          journal: "Health Equity",
          year: 2024,
          citation_count: 34,
          url: `https://pubmed.ncbi.nlm.nih.gov/39654321/`,
          abstract: "This systematic analysis examines how social determinants of health impact diabetes care outcomes. We analyzed data from 50,000 patients to identify key factors affecting treatment adherence and glycemic control."
        },
        {
          pmid: "39543210",
          title: "Economic evaluation of diabetes prevention programs worldwide",
          authors: ["Thompson, J.", "Garcia, P.", "Anderson, R."],
          journal: "Health Economics",
          year: 2024,
          citation_count: 28,
          url: `https://pubmed.ncbi.nlm.nih.gov/39543210/`,
          abstract: "We conducted a global economic evaluation of diabetes prevention programs, analyzing cost-effectiveness across 25 countries. Our findings show significant variation in program efficiency and long-term health outcomes."
        },
        {
          pmid: "39432109",
          title: "Gut microbiome and diabetes: New therapeutic targets",
          authors: ["Lee, H.", "Martinez, C.", "Wilson, D."],
          journal: "Microbiome Research",
          year: 2024,
          citation_count: 89,
          url: `https://pubmed.ncbi.nlm.nih.gov/39432109/`,
          abstract: "This research explores the relationship between gut microbiome composition and diabetes development. We identified specific bacterial strains that could serve as therapeutic targets for diabetes prevention and management."
        },
        {
          pmid: "39321098",
          title: "Continuous glucose monitoring: Impact on diabetes outcomes",
          authors: ["Kumar, S.", "Taylor, B.", "White, J."],
          journal: "Diabetes Technology",
          year: 2024,
          citation_count: 56,
          url: `https://pubmed.ncbi.nlm.nih.gov/39321098/`,
          abstract: "We evaluated the impact of continuous glucose monitoring on diabetes management outcomes in 2,000 patients over 12 months. Results show significant improvements in HbA1c levels and reduced hypoglycemic episodes."
        },
        {
          pmid: "39210987",
          title: "Pediatric diabetes management: Family-centered care approaches",
          authors: ["Roberts, K.", "Green, L.", "Clark, N."],
          journal: "Pediatric Diabetes",
          year: 2024,
          citation_count: 41,
          url: `https://pubmed.ncbi.nlm.nih.gov/39210987/`,
          abstract: "This study examines family-centered care approaches in pediatric diabetes management. We analyzed outcomes from 500 families to identify best practices for supporting children with diabetes and their caregivers."
        },
        {
          pmid: "39109876",
          title: "Diabetes and cardiovascular disease: Integrated treatment strategies",
          authors: ["Miller, P.", "Jones, R.", "Smith, A."],
          journal: "Cardio-Diabetes",
          year: 2024,
          citation_count: 73,
          url: `https://pubmed.ncbi.nlm.nih.gov/39109876/`,
          abstract: "We developed integrated treatment strategies for patients with both diabetes and cardiovascular disease. Our multidisciplinary approach reduced major adverse cardiovascular events by 35% over 24 months."
        }
      ].slice(0, limit),
      total_found: 8,
      limit: limit,
      search_parameters: {
        content_type: "linked",
        similarity_threshold: 0.2
      }
    };

    return NextResponse.json(mockLinkedContent);

  } catch (error) {
    console.error('Related content proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
