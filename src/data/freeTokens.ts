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
  "updatedAt": "2026-05-27T05:45:00Z",
  "maintainer": "mimo-1",
  "disclaimer": "Provider offers change frequently. Always verify terms, region, eligibility, and rate limits on the linked official page before relying on an offer.",
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
    }
  ]
} satisfies FreeTokensData;

export const FREE_TOKENS_REPO_URL = 'https://github.com/huangzesen/free-tokens';
export const FREE_TOKENS_JSON_URL = 'https://raw.githubusercontent.com/huangzesen/free-tokens/main/public/free-tokens.json';
