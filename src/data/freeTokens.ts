export type FreeTokenItem = {
  provider: string;
  region: string;
  category: string;
  offer: string;
  offerZh: string;
  amount: string;
  eligibility: string;
  caveats: string;
  officialUrl: string;
  secondaryUrl?: string;
  sourceQuote: string;
  lastChecked: string;
  status: string;
};

export type FreeTokensData = {
  schemaVersion: string;
  title: string;
  titleZh: string;
  updatedAt: string;
  maintainer: string;
  disclaimer: string;
  items: FreeTokenItem[];
};

export const freeTokensData = {
  "schemaVersion": "1.0.0",
  "title": "Free AI Tokens & API Credits",
  "titleZh": "免费 AI Token / API 额度索引",
  "updatedAt": "2026-05-27T06:15:00Z",
  "maintainer": "mimo-1",
  "disclaimer": "各家免费额度、地区、有效期和风控会频繁变化；使用前请点开每条详情里的官方来源再次确认。",
  "items": [
    {
      "provider": "Google AI Studio / Gemini API",
      "region": "Global",
      "category": "free-tier",
      "offer": "New Gemini API projects start on a Free Tier for eligible models, up to the published per-model free-tier rate limits.",
      "offerZh": "Gemini API 新项目默认有 Free Tier，可在指定模型上按官方发布的免费层速率限制调用。",
      "amount": "Model-specific free-tier rate limits",
      "eligibility": "Google AI Studio / Gemini API account; billing optional until upgrading beyond the Free Tier.",
      "caveats": "Free-tier traffic and limits vary by model and may differ from paid tiers; check current rate-limit table before use.",
      "officialUrl": "https://ai.google.dev/gemini-api/docs/billing",
      "secondaryUrl": "https://ai.google.dev/gemini-api/docs/rate-limits",
      "sourceQuote": "New accounts begin on the Free Tier, which allows access to certain models in the Gemini API and AI Studio, up to the models' free tier rate limits.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "OpenRouter",
      "region": "Global",
      "category": "free-models",
      "offer": "OpenRouter exposes free model variants and an openrouter/free router for free inference.",
      "offerZh": "OpenRouter 提供 `:free` 模型变体，以及 `openrouter/free` 免费推理路由。",
      "amount": "Free models; free-model requests are rate-limited",
      "eligibility": "OpenRouter account and API key.",
      "caveats": "Free model availability changes; quality/latency/context depend on the selected upstream provider.",
      "officialUrl": "https://openrouter.ai/openrouter/free",
      "secondaryUrl": "https://openrouter.ai/docs/api/reference/limits",
      "sourceQuote": "The simplest way to get free inference. openrouter/free is a router that selects free models at random from the models available on OpenRouter.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Groq",
      "region": "Global",
      "category": "free-tier",
      "offer": "Groq provides a free developer tier subject to the published model rate limits.",
      "offerZh": "Groq 提供免费开发者层，按官方模型速率限制使用。",
      "amount": "Published free-tier RPM/TPM/RPD limits by model",
      "eligibility": "Groq Console account and API key.",
      "caveats": "Limits are model-specific and may change; check the console docs before relying on a throughput number.",
      "officialUrl": "https://console.groq.com/docs/rate-limits",
      "secondaryUrl": "https://community.groq.com/t/is-there-a-free-tier-and-what-are-its-limits/790",
      "sourceQuote": "Rate limits act as control measures to regulate how frequently users and applications can access our API within specified timeframes.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Cloudflare Workers AI",
      "region": "Global",
      "category": "daily-free-allocation",
      "offer": "Workers AI includes a daily free allocation on both Free and Paid Workers plans.",
      "offerZh": "Workers AI 在 Free 和 Paid Workers 计划中都包含每日免费额度。",
      "amount": "10,000 Neurons per day",
      "eligibility": "Cloudflare account with Workers AI access.",
      "caveats": "Neurons map differently to tokens/images/audio by model; compare the pricing table for each model.",
      "officialUrl": "https://developers.cloudflare.com/workers-ai/platform/pricing/",
      "secondaryUrl": "https://developers.cloudflare.com/workers-ai/",
      "sourceQuote": "Our free allocation allows anyone to use a total of 10,000 Neurons per day at no charge.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Cohere",
      "region": "Global",
      "category": "trial-key",
      "offer": "Cohere gives every registered user a free, rate-limited trial/evaluation API key.",
      "offerZh": "Cohere 注册用户可获得免费但限速的 trial/evaluation API key。",
      "amount": "Rate-limited evaluation key",
      "eligibility": "Cohere account registration.",
      "caveats": "Trial keys are not for production; upgrade to a production key for higher limits/production use.",
      "officialUrl": "https://docs.cohere.com/docs/rate-limits",
      "secondaryUrl": "https://docs.cohere.com/docs/going-live",
      "sourceQuote": "Cohere offers two kinds of API keys: evaluation keys (free but limited in usage), and production keys (paid and much less limited in usage).",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Mistral AI La Plateforme",
      "region": "Global",
      "category": "free-tier",
      "offer": "Mistral introduced a free API tier on La Plateforme; exact limits are shown in the workspace Admin > Limits page.",
      "offerZh": "Mistral 在 La Plateforme 引入了免费 API 层；具体额度需在 Workspace Admin > Limits 查看。",
      "amount": "Workspace-specific free API tier limits",
      "eligibility": "Mistral AI La Plateforme workspace.",
      "caveats": "Current numerical limits are account/workspace-specific; verify inside the dashboard.",
      "officialUrl": "https://docs.mistral.ai/getting-started/changelog/",
      "secondaryUrl": "https://docs.mistral.ai/admin/user-management-finops/tier",
      "sourceQuote": "We introduced a free API tier on La Plateforme.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "NVIDIA NIM / API Catalog",
      "region": "Global",
      "category": "developer-program",
      "offer": "The free NVIDIA Developer Program provides access to NIMs through the NVIDIA API Catalog; NVIDIA also advertises a free 90-day AI Enterprise trial for enterprise-grade access.",
      "offerZh": "免费 NVIDIA Developer Program 可通过 NVIDIA API Catalog 访问 NIM；企业级访问另有 90 天 AI Enterprise trial。",
      "amount": "API Catalog access; 90-day AI Enterprise trial option",
      "eligibility": "NVIDIA Developer Program account; business email may be required for enterprise trial.",
      "caveats": "Catalog access and hosted endpoints can differ from self-hosted NIM licensing; read terms before production use.",
      "officialUrl": "https://docs.nvidia.com/nim/large-language-models/latest/introduction.html",
      "secondaryUrl": "https://build.nvidia.com/",
      "sourceQuote": "Join the free NVIDIA Developer Program and access NIMs through the NVIDIA API Catalog.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Alibaba Cloud Bailian / Model Studio",
      "region": "China mainland",
      "category": "new-user-quota",
      "offer": "New users receive model-specific newcomer free quota when first activating Alibaba Cloud Bailian China mainland edition.",
      "offerZh": "首次开通阿里云百炼中国内地版时，平台会自动发放各模型新人专属免费额度。",
      "amount": "Model-specific free quota; valid 30–90 days",
      "eligibility": "Alibaba Cloud account activating Bailian China mainland edition.",
      "caveats": "Only China mainland edition has the free quota; quota covers real-time inference fees, not every scenario.",
      "officialUrl": "https://help.aliyun.com/zh/model-studio/new-free-quota",
      "secondaryUrl": "https://bailian.console.aliyun.com/",
      "sourceQuote": "仅中国内地版模型享有免费额度，其他地域无免费额度。免费额度的有效期为 30～90 天。",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Baidu Qianfan",
      "region": "China mainland",
      "category": "new-user-quota",
      "offer": "New users receive free Tokens quota automatically after activating Qianfan and agreeing to the user agreement.",
      "offerZh": "访问千帆平台并同意协议后，系统自动开通平台并发放新用户免费 Tokens 额度。",
      "amount": "Model-specific free token quotas and validity periods",
      "eligibility": "Baidu Cloud / Qianfan new user.",
      "caveats": "Quota applies to preset model online inference token consumption, not batch inference.",
      "officialUrl": "https://cloud.baidu.com/doc/qianfan/s/Imi2rpirg",
      "secondaryUrl": "https://cloud.baidu.com/product-s/qianfan_home",
      "sourceQuote": "系统将自动开通千帆大模型平台并发放新用户免费Tokens额度。",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Volcengine Ark / Doubao",
      "region": "China mainland",
      "category": "daily-free-quota",
      "offer": "Volcengine Ark advertises daily free inference quota for eligible models on its model service platform.",
      "offerZh": "火山方舟提供符合条件模型的每日免费推理额度活动。",
      "amount": "Up to 50M free tokens per model per day (per product-page wording)",
      "eligibility": "Volcengine Ark account; eligible models/activity terms apply.",
      "caveats": "Activity rules and eligible models can change; verify the free-inference-quota activity page.",
      "officialUrl": "https://www.volcengine.com/docs/82379/1399514?redirect=1&lang=zh",
      "secondaryUrl": "https://www.volcengine.com/product/ark",
      "sourceQuote": "领每日单模型最高5000万免费Tokens。",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "ModelScope API Inference",
      "region": "China / Global developer community",
      "category": "free-api-inference",
      "offer": "ModelScope API Inference offers open-source models as standardized API services free of charge for developer experience.",
      "offerZh": "ModelScope API Inference 将开源模型标准化为 API 服务，供开发者免费体验。",
      "amount": "Free API Inference usage subject to platform limits",
      "eligibility": "ModelScope account/API access.",
      "caveats": "The service is described as non-commercial/non-profit; limits and supported models vary.",
      "officialUrl": "https://www.modelscope.cn/docs/model-service/API-Inference/limits",
      "secondaryUrl": "https://www.modelscope.cn/home",
      "sourceQuote": "API Inference ... offering them free of charge for developers to experience.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Fireworks AI",
      "region": "Global",
      "category": "signup-credits",
      "offer": "Fireworks pricing page advertises free starting credits for trying serverless inference.",
      "offerZh": "Fireworks 定价页显示提供起步免费 credits 用于试用 serverless inference。",
      "amount": "$1 free credits",
      "eligibility": "Fireworks account signup.",
      "caveats": "Small trial credit; exact availability may vary by account and region.",
      "officialUrl": "https://fireworks.ai/pricing",
      "secondaryUrl": "https://docs.fireworks.ai/",
      "sourceQuote": "Get started with $1 in free credits.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Hugging Face Inference Providers",
      "region": "Global",
      "category": "free-credits",
      "offer": "Hugging Face Inference Providers pricing documents free credits to get started across supported inference providers.",
      "offerZh": "Hugging Face Inference Providers 定价文档提供用于开始体验的免费 credits。",
      "amount": "Free credits to get started",
      "eligibility": "Hugging Face account; provider/model availability varies.",
      "caveats": "Centralized pay-as-you-go service; free credits and provider access can change.",
      "officialUrl": "https://huggingface.co/docs/inference-providers/pricing",
      "secondaryUrl": "https://huggingface.co/docs/inference-providers/index",
      "sourceQuote": "Free Credits to Get Started.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Anthropic Claude API",
      "region": "Global",
      "category": "starter-credits",
      "offer": "Anthropic states that new users receive a small amount of free credits to test the Claude API.",
      "offerZh": "Anthropic 文档称新用户会获得少量免费 credits 用于测试 Claude API。",
      "amount": "Small amount of free test credits",
      "eligibility": "New Anthropic Console/API users.",
      "caveats": "Amount is not advertised as a fixed public number; check the console/billing page after signup.",
      "officialUrl": "https://platform.claude.com/docs/en/about-claude/pricing",
      "secondaryUrl": "https://console.anthropic.com/",
      "sourceQuote": "New users receive a small amount of free credits to test the API.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "GitHub Models",
      "region": "Global",
      "category": "free-get-started",
      "offer": "GitHub Models is free for everyone to get started building AI and can be used directly within GitHub.",
      "offerZh": "GitHub Models 对所有人免费开放入门体验，可直接在 GitHub 内使用。",
      "amount": "Free getting-started access subject to GitHub Models limits",
      "eligibility": "GitHub account with GitHub Models access.",
      "caveats": "Preview/product limits and model availability may change.",
      "officialUrl": "https://github.com/features/models",
      "secondaryUrl": "https://docs.github.com/en/github-models",
      "sourceQuote": "GitHub Models is free for everyone to get started building AI with and can be leveraged directly within GitHub.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Cerebras Inference API",
      "region": "Global",
      "category": "free-tier",
      "offer": "Cerebras lists a Free plan for Inference API access, intended as the easiest way to start with Cerebras-powered models.",
      "offerZh": "Cerebras 官网价格页列出 Inference API 的 Free 方案，可免费开始使用 Cerebras 驱动的模型，适合测试高速推理。",
      "amount": "Free plan; current model access and limits are published by Cerebras and may change.",
      "eligibility": "Cerebras Cloud account / API access; verify current signup and regional availability on the official pricing page.",
      "caveats": "Free-tier limits, model list, and support level can change; check pricing and dashboard before production use.",
      "officialUrl": "https://www.cerebras.ai/pricing",
      "secondaryUrl": "https://cloud.cerebras.ai/",
      "sourceQuote": "Inference API access — Free — The easiest way to get started with Cerebras; access to all Cerebras powered models.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "AI21 Studio / Jamba API",
      "region": "Global",
      "category": "signup-credits",
      "offer": "New AI21 accounts receive a limited-time platform credit usable across APIs, SDK, and playground.",
      "offerZh": "AI21 官方文档说明：新账号可获得平台试用额度，可用于 API、SDK 和 Playground。",
      "amount": "$10 credit, valid for three months (per AI21 documentation).",
      "eligibility": "New AI21 Studio account.",
      "caveats": "Credit expires after the published window; pricing and eligible products may change.",
      "officialUrl": "https://docs.ai21.com/docs/usage-cost",
      "secondaryUrl": "https://docs.ai21.com/docs/managing-your-account",
      "sourceQuote": "New accounts are given a $10 credit good for three months on the AI21 platform. You can use your credit for all usage of the APIs, the SDK, and the playground.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Upstage Console / Solar API",
      "region": "Global / Korea-friendly",
      "category": "signup-credits",
      "offer": "Upstage Console advertises free signup credit for API users on its console pages.",
      "offerZh": "Upstage Console 登录/Key 页面显示注册赠送免费额度，可用于体验 Solar 等 API 能力。",
      "amount": "$10 free credit shown on Upstage Console signup pages.",
      "eligibility": "New Upstage Console account.",
      "caveats": "Console-gated offer; verify availability after login and before relying on a fixed amount.",
      "officialUrl": "https://console.upstage.ai/api-keys?api=chat-reasoning",
      "secondaryUrl": "https://console.upstage.ai/",
      "sourceQuote": "Sign up to receive $10 free credit!",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "AssemblyAI",
      "region": "Global",
      "category": "signup-credits",
      "offer": "AssemblyAI gives new accounts free API credits for speech-to-text and speech-understanding products.",
      "offerZh": "AssemblyAI 官方账号文档说明，新账号有免费额度，可用于录音转写、实时转写、语音理解和 Guardrails。",
      "amount": "$50 in free credits; docs state credits do not expire until used.",
      "eligibility": "New AssemblyAI account on the free trial.",
      "caveats": "Credit card is needed when upgrading after free credits are exhausted; supported products follow AssemblyAI account terms.",
      "officialUrl": "https://www.assemblyai.com/docs/account-management",
      "secondaryUrl": "https://www.assemblyai.com/docs/faq/do-my-free-credits-expire",
      "sourceQuote": "New accounts receive $50 in free credits for Pre-recorded STT, Streaming STT, Speech Understanding, and Guardrails. Credits do not expire.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "ElevenLabs API",
      "region": "Global",
      "category": "free-plan",
      "offer": "ElevenLabs includes a Free public plan and supports Pay As You Go even from self-serve plans including free.",
      "offerZh": "ElevenLabs 官方计费文档列出 Free 公共套餐；免费套餐可用于体验语音/音频 API，后续可按需充值。",
      "amount": "Free plan with included monthly credit quota; exact quota depends on current ElevenLabs plan table.",
      "eligibility": "ElevenLabs account on the Free plan.",
      "caveats": "Monthly credit amount and feature access vary by plan and may change; check the live billing/plan page.",
      "officialUrl": "https://elevenlabs.io/docs/overview/administration/billing",
      "secondaryUrl": "https://elevenlabs.io/docs/overview/administration/pay-as-you-go",
      "sourceQuote": "We offer five public plans: Free, Starter, Creator, Pro, Scale, and Business.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "fal.ai",
      "region": "Global",
      "category": "free-tier",
      "offer": "fal.ai advertises a free tier for getting started with media-generation model APIs, plus separate sandbox/playground credits.",
      "offerZh": "fal.ai 官方价格页写有 free tier，可用于开始体验图像、视频、3D、音频等生成模型；Sandbox/Playground 还有单独免费券。",
      "amount": "Free tier; sandbox/free request coupons are separate and may be limited to Playground/Sandbox.",
      "eligibility": "fal.ai account; verify whether a specific credit is API-usable or sandbox-only.",
      "caveats": "fal docs state free credits/coupons may be usable only in Sandbox/Playground, not API/Workflows; check before automation.",
      "officialUrl": "https://fal.ai/pricing",
      "secondaryUrl": "https://fal.ai/docs/documentation/model-apis/sandbox",
      "sourceQuote": "Get started with a free tier and upgrade as you need more resources. Free credits and free request coupons are only usable in Sandbox and the Playground.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Novita AI",
      "region": "Global",
      "category": "signup-credits",
      "offer": "Novita AI signup page advertises free credit for new accounts, and a referral program grants LLM API credits to both sides.",
      "offerZh": "Novita AI 官方注册页显示新用户赠送免费额度；推荐计划还会给双方 LLM API credits。",
      "amount": "$1 free credit on signup; referral page advertises $10 + $10 LLM API credits.",
      "eligibility": "New Novita AI account; referral credits require referral flow.",
      "caveats": "Third-party guides sometimes quote different signup amounts; rely on the official register/referral pages currently shown.",
      "officialUrl": "https://novita.ai/user/register",
      "secondaryUrl": "https://novita.ai/referral",
      "sourceQuote": "Join Novita AI today and get $1 free credit. Refer a friend to Novita and both earn $10 in LLM API credits.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Jina AI Embeddings / Reranker / Reader",
      "region": "Global",
      "category": "free-tokens",
      "offer": "Jina AI product pages expose free API-token usage for embeddings/reranker/reader-style search infrastructure APIs.",
      "offerZh": "Jina AI 页面显示可免费试用 reranker/API token，用于 embeddings、rerank、reader 等搜索基础设施能力。",
      "amount": "Free token limit; public copy has advertised 1M free API tokens for embeddings, but verify current dashboard amount.",
      "eligibility": "Jina AI account/API key.",
      "caveats": "Exact free-token pool can vary by product and current campaign; check account quota after creating a key.",
      "officialUrl": "https://jina.ai/embeddings/",
      "secondaryUrl": "https://jina.ai/",
      "sourceQuote": "Try reranker API for free. Once the free token limit is reached, users can purchase additional tokens for their API keys.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Perplexity for Startups / API Credits",
      "region": "Global startup program",
      "category": "startup-program",
      "offer": "Perplexity's startup program advertises API credits bundled with Enterprise Pro access for eligible startups.",
      "offerZh": "Perplexity for Startups 面向符合条件的初创公司，官方页面写有 Enterprise Pro 试用和 API credits。",
      "amount": "Up to $5,000 in API credits for eligible startups, plus six months of Enterprise Pro seats.",
      "eligibility": "Startup <5 years old, <$20M raised, and backed by an approved/eligible startup partner or investor per Perplexity terms.",
      "caveats": "Not a general-user free tier; eligibility-gated and subject to Perplexity program changes.",
      "officialUrl": "https://www.perplexity.ai/startups/",
      "secondaryUrl": "https://docs.perplexity.ai/docs/getting-started/overview",
      "sourceQuote": "Perplexity for Startups offers 6 months free of Enterprise Pro (50 seats) + $5K in API credits.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "xAI API + X Developer Credits",
      "region": "Global / X developer regions",
      "category": "credit-bonus",
      "offer": "X developer pricing docs describe earning free xAI API credits when purchasing X API credits and linking an xAI team.",
      "offerZh": "X API 官方价格文档说明：购买 X API credits 后，按账期累计消费可获得 free xAI API credits，需要关联 xAI team。",
      "amount": "Bonus free xAI API credits based on cumulative X API credit spend during a billing cycle.",
      "eligibility": "X developer account with X API credits; linked xAI team in developer console.",
      "caveats": "This is a spend-linked bonus, not no-cost signup credit; verify current xAI/X country and billing requirements.",
      "officialUrl": "https://docs.x.com/x-api/getting-started/pricing",
      "secondaryUrl": "https://x.ai/api",
      "sourceQuote": "Free xAI API credits: When you purchase X API credits, you can earn free xAI API credits based on your cumulative spend during a billing cycle.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "SambaNova Cloud",
      "region": "Global",
      "category": "free-api-access",
      "offer": "SambaNova Cloud provides developer API access to hosted open-source models, with public materials describing free API access for getting started.",
      "offerZh": "SambaNova Cloud 提供托管开源模型 API，适合开发者免费/低门槛体验高速推理；具体速率限制以 Cloud 控制台为准。",
      "amount": "Free developer API access / rate-limited usage; exact RPM and model availability vary.",
      "eligibility": "SambaNova Cloud account and API key.",
      "caveats": "Official landing page is console-first; confirm current rate limits and billing requirements after login.",
      "officialUrl": "https://cloud.sambanova.ai/apis",
      "secondaryUrl": "https://sambanova.ai/",
      "sourceQuote": "SambaNova Cloud delivers the fastest AI inference with state-of-the-art models. API Keys. AI Starter Kits.",
      "lastChecked": "2026-05-27",
      "status": "active"
    },
    {
      "provider": "Pollinations AI",
      "region": "Global",
      "category": "free-compute",
      "offer": "Pollinations advertises free compute and easy APIs for building AI apps.",
      "offerZh": "Pollinations 官方首页主打 free compute 和社区支持，适合用免费 API/端点快速做文本、图片等轻量应用原型。",
      "amount": "Free compute / community-supported API usage; no fixed token-credit amount published in the snippet.",
      "eligibility": "Public API usage according to Pollinations terms and endpoints.",
      "caveats": "Community/free compute can have availability, quality, and rate-limit tradeoffs; do not treat as SLA-backed production credit.",
      "officialUrl": "https://pollinations.ai/",
      "secondaryUrl": "https://github.com/pollinations/pollinations",
      "sourceQuote": "Build AI apps with easy APIs, free compute, and community support.",
      "lastChecked": "2026-05-27",
      "status": "active"
    }
  ]
} satisfies FreeTokensData;

export const FREE_TOKENS_REPO_URL = 'https://github.com/huangzesen/free-tokens';
export const FREE_TOKENS_JSON_URL = 'https://raw.githubusercontent.com/huangzesen/free-tokens/main/public/free-tokens.json';
