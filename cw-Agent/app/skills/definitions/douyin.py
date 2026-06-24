from app.skills.base import CopySkill, ExecutionStep, QualityStandard, ToolSpec


DOUYIN_BEAUTY_SKILL = CopySkill(
    name="抖音_美妆_带货",
    platforms=["抖音"],
    categories=["美妆", "护肤", "彩妆", "个护"],
    description="抖音美妆带货口播文案，强调快节奏、口语化、强转化",
    execution_steps=[
        ExecutionStep(order=1, name="吸睛开头",
                      description="前3秒用惊叹/疑问/数字抓住注意力，直接点出效果对比",
                      action="以'姐妹们'或'天呐'开头，给出一个让人震惊的效果描述或问句"),
        ExecutionStep(order=2, name="痛点共鸣",
                      description="描述用户常见困扰，建立情感连接",
                      action="用'你是不是也...'句式引发共鸣，锚定受众痛点"),
        ExecutionStep(order=3, name="产品展示",
                      description="逐一介绍核心卖点，强调差异化优势，配合使用感受描述",
                      action="列出核心卖点，用'它含有...'、'而且...'、'关键是...'串联，穿插使用体验"),
        ExecutionStep(order=4, name="促单CTA",
                      description="制造紧迫感，引导下单",
                      action="限时优惠/限量话术 + '点击下方链接/左下角下单/赶紧冲'引导"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头3秒内必须包含数字、问句或感叹句，确保吸睛",
        cta_presence="结尾必须包含明确CTA（'点击下方链接'/'左下角下单'/'赶紧冲'/'别犹豫了'）",
        forbidden_words=["最好", "第一", "绝对", "100%有效", "永不", "顶级", "唯一"],
        max_chars_per_sentence=30,
        tone_keywords=["口语化", "快节奏", "有感染力", "像朋友聊天"],
    ),
    tools=[
        ToolSpec(tool_name="违禁词检测", description="检测文案中是否包含广告法违禁词"),
        ToolSpec(tool_name="字数校验", description="验证文案字数是否在目标范围 ±15% 内"),
    ],
    prompt_template=(
        "你是一个抖音带货主播的文案撰写助手，深谙抖音平台流量密码。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案（请学习其风格和结构）\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字（对应 {duration} 秒）\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案，不要包含任何解释说明。"
    ),
)

DOUYIN_DIGITAL_SKILL = CopySkill(
    name="抖音_数码_带货",
    platforms=["抖音"],
    categories=["数码", "3C", "手机", "电脑", "配件", "智能设备"],
    description="抖音数码产品带货文案，强调参数对比和真实体验",
    execution_steps=[
        ExecutionStep(order=1, name="情景引入",
                      description="用一个真实使用场景开场，让用户代入",
                      action="以'你有没有遇到过...'或'用了一次就后悔没早买'开头"),
        ExecutionStep(order=2, name="参数对比",
                      description="简洁有力地对比同类产品，突出本品优势参数",
                      action="用数字对比突出性能差异，如'市面上普遍的XXX，但这个直接...'"),
        ExecutionStep(order=3, name="功能演示",
                      description="展示最震撼的1-2个核心功能，建立记忆点",
                      action="聚焦最核心卖点，用'实测发现...'或'用过的都说...'增加可信度"),
        ExecutionStep(order=4, name="下单理由",
                      description="性价比/限时优惠/赠品，促使用户行动",
                      action="突出价格优势或赠品福利，配合'手慢无'、'库存不多了'"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用疑问句或使用场景引入，避免平铺直叙",
        cta_presence="结尾必须有下单引导，如'点击下方链接'/'左下角'",
        forbidden_words=["最好", "第一", "绝对", "永不坏"],
        max_chars_per_sentence=35,
        tone_keywords=["直接", "干货", "参数硬核", "真实体验"],
    ),
    prompt_template=(
        "你是一个抖音数码类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_FOOD_SKILL = CopySkill(
    name="抖音_食品_带货",
    platforms=["抖音"],
    categories=["食品", "零食", "饮品", "特产"],
    description="抖音食品带货文案，强调感官刺激和场景化消费",
    execution_steps=[
        ExecutionStep(order=1, name="感官冲击",
                      description="用视觉/味觉/嗅觉描述刺激购买欲",
                      action="以'打开包装的那一瞬间...'或'一口下去...'开头"),
        ExecutionStep(order=2, name="产地/工艺背书",
                      description="突出源头优势，建立品质信任",
                      action="简介产地/选材/工艺亮点，建立差异化"),
        ExecutionStep(order=3, name="场景种草",
                      description="描绘使用场景，激发想象",
                      action="描述'追剧时'、'办公室下午'、'送礼'等具体场景"),
        ExecutionStep(order=4, name="价格促单",
                      description="强调性价比和限时优惠",
                      action="对比日常价，突出活动力度，催促下单"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须有感官描述（视觉/味觉/嗅觉），用感叹句或拟声词",
        cta_presence="结尾必须有购买引导，含'下方链接'/'赶紧囤'/'手慢无'",
        forbidden_words=["最好吃", "第一美味", "绝对"],
        max_chars_per_sentence=28,
        tone_keywords=["诱人", "真实", "场景化", "食欲感"],
    ),
    prompt_template=(
        "你是一个抖音美食带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_FASHION_SKILL = CopySkill(
    name="抖音_服饰_带货",
    platforms=["抖音"],
    categories=["服饰", "服装"],
    description="抖音服饰带货文案，强调上身效果和穿搭场景",
    execution_steps=[
        ExecutionStep(order=1, name="视觉种草",
                      description="描述穿着效果，让用户想象自己穿上的样子",
                      action="以'这件真的谁穿谁好看'或逛商场般的语气开头"),
        ExecutionStep(order=2, name="面料版型",
                      description="介绍面料质感和版型优势",
                      action="强调'不起球'、'显瘦'、'不挑身材'等核心痛点词"),
        ExecutionStep(order=3, name="搭配建议",
                      description="给出穿搭方案增加购买理由",
                      action="给出2-3种搭配组合，降低用户决策成本"),
        ExecutionStep(order=4, name="价格促单",
                      description="强调性价比和限时优惠",
                      action="'这个价格能买到这种品质' + 促销话术"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用视觉/穿着效果描述，避免'今天给大家推荐'等模板化开头",
        cta_presence="结尾含'链接放下面了'/'左下角'等下单引导",
        forbidden_words=["最好看", "绝对显瘦", "永不褪色"],
        max_chars_per_sentence=30,
        tone_keywords=["时尚感", "氛围感", "穿搭参考", "真实"],
    ),
    prompt_template=(
        "你是一个抖音服饰带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_SHOES_BAGS_SKILL = CopySkill(
    name="抖音_鞋靴箱包_带货",
    platforms=["抖音"],
    categories=["鞋靴箱包", "鞋", "靴子", "箱包", "包包", "背包", "行李箱"],
    description="抖音鞋靴箱包带货文案，强调质感、工艺和实用性",
    execution_steps=[
        ExecutionStep(order=1, name="视觉抓眼球",
                      description="用鞋/包的细节特写或整体搭配效果吸引注意力",
                      action="以'这双鞋/这个包的质感你们自己看'或'一眼就被它的XX吸引了'开头"),
        ExecutionStep(order=2, name="材质工艺",
                      description="强调皮质、五金、工艺等品质细节",
                      action="强调'头层牛皮'、'手工缝制'、'五金件质感'等品质关键词"),
        ExecutionStep(order=3, name="实用场景",
                      description="展示多场景搭配或使用场景",
                      action="'上班通勤/周末逛街/出差旅行'等多场景切换"),
        ExecutionStep(order=4, name="性价比促单",
                      description="对比专柜价突出性价比",
                      action="'专柜同款XX元，我们直接XX' + 限时优惠话术"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用质感/细节特写或搭配效果抓眼球",
        cta_presence="结尾含'左下角抢'/'链接放下面了'/'手慢无'",
        forbidden_words=["最好", "第一", "绝对", "永不磨损"],
        max_chars_per_sentence=30,
        tone_keywords=["质感", "高级感", "实用", "百搭"],
    ),
    prompt_template=(
        "你是一个抖音鞋靴箱包带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_WATCH_JEWELRY_SKILL = CopySkill(
    name="抖音_钟表配饰_带货",
    platforms=["抖音"],
    categories=["钟表配饰", "手表", "配饰", "首饰", "墨镜", "围巾"],
    description="抖音钟表配饰带货文案，强调精致感和身份象征",
    execution_steps=[
        ExecutionStep(order=1, name="精致开场",
                      description="用特写镜头式的文字展现产品精致感",
                      action="以'这件配饰的做工真的惊到我了'或'戴上瞬间气质就上来了'开头"),
        ExecutionStep(order=2, name="设计细节",
                      description="详细描述设计亮点和工艺",
                      action="强调'表盘设计'、'镶嵌工艺'、'玫瑰金配色'等设计元素"),
        ExecutionStep(order=3, name="搭配效果",
                      description="展示不同场合的佩戴效果",
                      action="'配西装/裙子/日常穿搭都不违和'的描述"),
        ExecutionStep(order=4, name="价值感促单",
                      description="强调物超所值和送礼属性",
                      action="'送礼倍有面子'/'这个价位能买到这种品质' + 限量话术"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用细节特写或佩戴效果抓眼球",
        cta_presence="结尾含'左下角'/'手慢无'等下单引导",
        forbidden_words=["最好", "第一", "绝对", "永不变色"],
        max_chars_per_sentence=28,
        tone_keywords=["精致", "高级", "气质", "送礼"],
    ),
    prompt_template=(
        "你是一个抖音钟表配饰类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_SMART_HOME_SKILL = CopySkill(
    name="抖音_智能家居_带货",
    platforms=["抖音"],
    categories=["智能家居", "家电", "家居", "灯具", "收纳"],
    description="抖音智能家居带货文案，强调科技感和生活品质提升",
    execution_steps=[
        ExecutionStep(order=1, name="生活痛点",
                      description="用居家场景痛点引起共鸣",
                      action="以'每次回家还要手动XXX，真的太麻烦了'或'你家是不是也XXX'开头"),
        ExecutionStep(order=2, name="智能解决",
                      description="展示产品如何一键解决痛点",
                      action="演示核心功能，强调'一句话/一键就能'的便捷感"),
        ExecutionStep(order=3, name="品质生活",
                      description="描绘使用后的美好居家场景",
                      action="'下班回家灯已亮、地已扫、空调已开'的场景化描述"),
        ExecutionStep(order=4, name="科技普惠",
                      description="强调智能生活方式的门槛降低",
                      action="'以前几万块才能实现的智能家居，现在几百块就能搞定'"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用真实居家痛点或用场景描述引起共鸣",
        cta_presence="结尾含'左下角下单'/'赶紧安排'等下单引导",
        forbidden_words=["最好", "第一", "绝对", "永不坏"],
        max_chars_per_sentence=35,
        tone_keywords=["科技感", "便捷", "品质生活", "省心"],
    ),
    prompt_template=(
        "你是一个抖音智能家居带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_MOM_BABY_PET_SKILL = CopySkill(
    name="抖音_母婴宠物_带货",
    platforms=["抖音"],
    categories=["母婴宠物", "母婴", "宠物", "婴儿", "萌宠", "猫狗"],
    description="抖音母婴宠物带货文案，强调安全、可爱和情感连接",
    execution_steps=[
        ExecutionStep(order=1, name="萌趣开场",
                      description="用萌娃或萌宠的可爱场景/痛点引发兴趣",
                      action="以'你家毛孩子也这样吗'或'新手妈妈看过来'开头"),
        ExecutionStep(order=2, name="安全品质",
                      description="强调材质安全和品质保障，消除顾虑",
                      action="强调'食品级硅胶'、'不含BPA'、'兽医师推荐'等安全关键词"),
        ExecutionStep(order=3, name="实用展示",
                      description="展示产品在实际使用中的便利性",
                      action="'出门遛娃/遛狗'/'在家互动'等使用场景实拍式描述"),
        ExecutionStep(order=4, name="安心促单",
                      description="以安全和性价比促成下单",
                      action="'为了毛孩子/宝宝的XX，这个真的值得入手' + 优惠话术"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用萌趣场景或真实痛点吸引目标人群",
        cta_presence="结尾含'左下角安排'/'赶紧囤'等下单引导",
        forbidden_words=["最好", "第一", "绝对安全", "永不"],
        max_chars_per_sentence=30,
        tone_keywords=["可爱", "放心", "实用", "有爱"],
    ),
    prompt_template=(
        "你是一个抖音母婴宠物类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_3C_APPLIANCE_SKILL = CopySkill(
    name="抖音_3C数码家电_带货",
    platforms=["抖音"],
    categories=["3C数码家电", "家电", "冰箱", "洗衣机", "空调", "电视", "扫地机", "洗碗机"],
    description="抖音3C数码家电带货文案，强调解放双手和品质生活升级",
    execution_steps=[
        ExecutionStep(order=1, name="家务痛点",
                      description="用让人共鸣的家务痛点开场",
                      action="以'做完家务腰都直不起来了'或'每天都在XXX上花一个小时'开头"),
        ExecutionStep(order=2, name="解放双手",
                      description="展示家电如何自动完成繁琐家务",
                      action="强调'一键启动'、'自动清洗'、'远程控制'等便捷功能"),
        ExecutionStep(order=3, name="效能对比",
                      description="与手动或旧款对比，突出性能提升",
                      action="'以前XXX要花两个小时，现在只需要按一下'的对比式描述"),
        ExecutionStep(order=4, name="长远省钱",
                      description="计算长期节省的时间和金钱，促成下单",
                      action="'一年省下的水电/时间够买好几个了' + '趁活动赶紧'"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用家务痛点或解放双手的爽感场景引入",
        cta_presence="结尾含'左下角'/'赶紧安排'等下单引导",
        forbidden_words=["最好", "第一", "绝对", "永不坏"],
        max_chars_per_sentence=35,
        tone_keywords=["解放双手", "省心省力", "实用", "品质升级"],
    ),
    prompt_template=(
        "你是一个抖音家电带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_BOOK_EDU_SKILL = CopySkill(
    name="抖音_图书教育_带货",
    platforms=["抖音"],
    categories=["图书教育", "图书", "教育", "儿童绘本", "考试", "教辅", "课程"],
    description="抖音图书教育带货文案，强调知识价值和成长改变",
    execution_steps=[
        ExecutionStep(order=1, name="认知开场",
                      description="用数据或现象引起用户对学习的重视",
                      action="以'有多少人还不知道...'或'学会这个真的太重要了'开头"),
        ExecutionStep(order=2, name="内容价值",
                      description="介绍图书/课程的独特内容价值",
                      action="突出'作者是XXX'、'涵盖XX个核心知识点'、'适合XX人群'"),
        ExecutionStep(order=3, name="改变见证",
                      description="引用学员/读者的真实改变案例",
                      action="'很多读者反馈看完这本书之后XX'的使用效果描述"),
        ExecutionStep(order=4, name="成长投资",
                      description="强调知识是最有价值的投资，促成下单",
                      action="'一顿饭的钱换一生的XX技能' + 限时优惠"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用数据、现象或认知冲击吸引目标人群",
        cta_presence="结尾含'左下角'/'抓紧入手'等下单引导",
        forbidden_words=["最好", "第一", "绝对", "保证提分"],
        max_chars_per_sentence=40,
        tone_keywords=["干货", "成长", "实用", "改变"],
    ),
    prompt_template=(
        "你是一个抖音图书教育类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_FLOWER_GARDEN_SKILL = CopySkill(
    name="抖音_鲜花园艺_带货",
    platforms=["抖音"],
    categories=["鲜花园艺", "花卉", "园艺", "盆栽", "绿植", "多肉", "花盆"],
    description="抖音鲜花园艺带货文案，强调治愈感和生活美学",
    execution_steps=[
        ExecutionStep(order=1, name="美感暴击",
                      description="用鲜花/绿植的视觉美感吸引观众",
                      action="以'这也太好看了吧'或'放在家里瞬间提升格调'开头"),
        ExecutionStep(order=2, name="养护简单",
                      description="打消养护难的顾虑",
                      action="强调'不用打理'、'浇浇水就活'、'懒人必备'等低门槛词"),
        ExecutionStep(order=3, name="场景布置",
                      description="展示植物在阳台/客厅/书房的布置效果",
                      action="'放在阳台就是一个小花园'/'办公室放一盆心情都好'的场景描述"),
        ExecutionStep(order=4, name="治愈促单",
                      description="以生活美学和价格优势促成下单",
                      action="'一杯奶茶钱换一整个月的好心情' + 数量有限话术"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用视觉美感或治愈感吸引观众",
        cta_presence="结尾含'左下角'/'赶紧带回家'等下单引导",
        forbidden_words=["最好", "第一", "绝对", "永不凋谢"],
        max_chars_per_sentence=28,
        tone_keywords=["治愈", "好看", "美好生活", "轻松养"],
    ),
    prompt_template=(
        "你是一个抖音鲜花园艺类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_SPORTS_OUTDOOR_SKILL = CopySkill(
    name="抖音_运动户外_带货",
    platforms=["抖音"],
    categories=["运动户外", "运动", "户外", "健身", "露营", "跑步", "瑜伽"],
    description="抖音运动户外带货文案，强调活力和使用场景",
    execution_steps=[
        ExecutionStep(order=1, name="活力开场",
                      description="用运动场景或健身目标激发兴趣",
                      action="以'夏天要来了，XX装备得安排上'或'户外玩了一天发现XX太重要了'开头"),
        ExecutionStep(order=2, name="功能实测",
                      description="展示产品的实际运动表现和功能",
                      action="强调'防滑/透气/轻量化/防水'等实测功能点"),
        ExecutionStep(order=3, name="场景种草",
                      description="描绘不同运动/户外场景的装备搭配",
                      action="'跑步/登山/露营/健身房都能用'的多场景覆盖"),
        ExecutionStep(order=4, name="运动投资",
                      description="强调投资运动装备就是投资健康",
                      action="'这个价位能买到专业级装备' + 限时优惠话术"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用运动场景或季节需求激发兴趣",
        cta_presence="结尾含'左下角'/'赶紧入手'等下单引导",
        forbidden_words=["最好", "第一", "绝对", "永不磨损"],
        max_chars_per_sentence=32,
        tone_keywords=["活力", "专业", "实用", "动感"],
    ),
    prompt_template=(
        "你是一个抖音运动户外类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_TOY_MUSIC_SKILL = CopySkill(
    name="抖音_玩具乐器_带货",
    platforms=["抖音"],
    categories=["玩具乐器", "玩具", "乐器", "益智", "拼装", "毛绒", "吉他", "键盘"],
    description="抖音玩具乐器带货文案，强调趣味性和亲子互动",
    execution_steps=[
        ExecutionStep(order=1, name="好玩开场",
                      description="用玩具的可玩性或乐器的美妙声音吸引注意力",
                      action="以'这个玩具我能玩一下午'或'这个声音也太好听了吧'开头"),
        ExecutionStep(order=2, name="玩法展示",
                      description="展示玩具的多变玩法或乐器的简易上手",
                      action="强调'多种玩法/配件'或'零基础也能弹'的低门槛设定"),
        ExecutionStep(order=3, name="成长价值",
                      description="突出益智/动手/音乐启蒙等教育价值",
                      action="'锻炼手眼协调'/'培养音乐兴趣'等成长价值描述"),
        ExecutionStep(order=4, name="送礼促单",
                      description="以亲子/送礼场景促成下单",
                      action="'送孩子/送朋友的绝佳选择' + '这个价位超值'"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用趣味性或声音美感吸引注意力",
        cta_presence="结尾含'左下角冲'/'安排'等下单引导",
        forbidden_words=["最好", "第一", "绝对安全"],
        max_chars_per_sentence=28,
        tone_keywords=["好玩", "有趣", "益智", "亲子"],
    ),
    prompt_template=(
        "你是一个抖音玩具乐器类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_FRESH_FOOD_SKILL = CopySkill(
    name="抖音_生鲜_带货",
    platforms=["抖音"],
    categories=["生鲜", "水果", "蔬菜", "海鲜", "肉类", "鸡蛋", "冷冻食品"],
    description="抖音生鲜带货文案，强调新鲜直达和原产地优势",
    execution_steps=[
        ExecutionStep(order=1, name="鲜活展示",
                      description="用新鲜度/产地实拍展示产品品质",
                      action="以'看看这个新鲜程度'或'刚从XX产地发来的'开头"),
        ExecutionStep(order=2, name="产地溯源",
                      description="突出原产地优势和新鲜直达保障",
                      action="强调'原产地直发'、'现摘现发'、'冷链配送'等新鲜保障"),
        ExecutionStep(order=3, name="品质对比",
                      description="与超市/菜市场的新鲜度和价格做对比",
                      action="'超市这个价格只能买一半'/'比菜市场还新鲜'的对比描述"),
        ExecutionStep(order=4, name="短保促单",
                      description="利用生鲜的季节性和稀缺性促成下单",
                      action="'这个季节才有的'/'头茬限量' + 家庭装优惠话术"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用新鲜度或产地实拍展示品质",
        cta_presence="结尾含'左下角下单'/'赶紧囤'等下单引导",
        forbidden_words=["最好吃", "第一", "绝对"],
        max_chars_per_sentence=28,
        tone_keywords=["新鲜", "产地直发", "鲜甜", "时令"],
    ),
    prompt_template=(
        "你是一个抖音生鲜带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_LOCAL_LIFE_SKILL = CopySkill(
    name="抖音_本地生活_带货",
    platforms=["抖音"],
    categories=["本地生活", "餐饮", "到店", "团购", "酒店", "旅游", "家政", "美容美发"],
    description="抖音本地生活带货文案，强调到店体验和限时优惠",
    execution_steps=[
        ExecutionStep(order=1, name="体验种草",
                      description="用沉浸式探店或体验描述吸引用户到店",
                      action="以'今天带你打卡一家XX'或'花XX钱在这体验了一次XX'开头"),
        ExecutionStep(order=2, name="服务展示",
                      description="展示店铺环境、服务品质、特色项目",
                      action="强调'环境超棒'、'服务贴心'、'技师专业'等体验关键词"),
        ExecutionStep(order=3, name="套餐亮点",
                      description="详解团购套餐内容和性价比",
                      action="'这么多项目/菜品才XX钱，原价要XXX'的性价比强调"),
        ExecutionStep(order=4, name="限时抢购",
                      description="用限时/限量制造紧迫感",
                      action="'秒杀价只有三天'/'库存不多，赶紧左下角囤'"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用沉浸式探店或超值体验描述吸引用户",
        cta_presence="结尾含'左下角抢'/'赶紧囤'/'手慢无'等下单引导",
        forbidden_words=["最好", "第一", "绝对"],
        max_chars_per_sentence=32,
        tone_keywords=["探店", "超值", "沉浸式", "冲"],
    ),
    prompt_template=(
        "你是一个抖音本地生活类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_JEWELRY_SKILL = CopySkill(
    name="抖音_珠宝文玩_带货",
    platforms=["抖音"],
    categories=["珠宝文玩", "珠宝", "文玩", "翡翠", "蜜蜡", "和田玉", "手串", "琥珀"],
    description="抖音珠宝文玩带货文案，强调鉴别知识和收藏价值",
    execution_steps=[
        ExecutionStep(order=1, name="知识开场",
                      description="用专业鉴别知识或稀有感吸引观众",
                      action="以'教你一眼分辨真假XX'或'这种品相的XX真的越来越少了'开头"),
        ExecutionStep(order=2, name="品相展示",
                      description="360度展示材质光泽、纹理、工艺细节",
                      action="强调'种水/油润度'、'纯手工雕刻'、'天然无优化'等专业术语"),
        ExecutionStep(order=3, name="价值解读",
                      description="解读收藏价值和佩戴意义",
                      action="'这种品质的市场价一般都在XX'/'戴出去懂行的都知道价值'的解读"),
        ExecutionStep(order=4, name="稀缺促单",
                      description="以稀缺性+性价比促成下单",
                      action="'就这一批料子，卖完等明年' + 源头价话术"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="开头必须用专业鉴别知识或稀有感吸引目标人群",
        cta_presence="结尾含'左下角'/'手慢无'等下单引导",
        forbidden_words=["最好", "第一", "绝对", "永不褪色"],
        max_chars_per_sentence=32,
        tone_keywords=["专业", "源头", "收藏", "稀缺"],
    ),
    prompt_template=(
        "你是一个抖音珠宝文玩类带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_GENERIC_SKILL = CopySkill(
    name="抖音_通用_带货",
    platforms=["抖音"],
    categories=["通用"],
    description="抖音通用带货文案，适合无明显品类匹配时使用",
    execution_steps=[
        ExecutionStep(order=1, name="抓注意力",
                      description="3秒内用好奇/痛点/数字抓住注意力",
                      action="用反问句、惊人数据或痛点描述开头"),
        ExecutionStep(order=2, name="解决方案",
                      description="介绍产品如何解决问题",
                      action="'直到我发现了这个...'引出产品"),
        ExecutionStep(order=3, name="核心卖点",
                      description="1个王牌卖点 + 2个辅助卖点",
                      action="重点说透最核心的1个卖点，其他简略带过"),
        ExecutionStep(order=4, name="促单",
                      description="限时/限量/优惠催促下单",
                      action="折扣话术 + CTA引导"),
    ],
    quality_standards=QualityStandard(
        opening_3s_rule="前3秒必须抓住注意力，使用问句/数字/感叹/冲突",
        cta_presence="结尾必须有明确CTA",
        forbidden_words=["最好", "第一", "绝对"],
        max_chars_per_sentence=35,
        tone_keywords=["口语化", "有感染力", "自然"],
    ),
    prompt_template=(
        "你是一个抖音带货主播的文案撰写助手。\n"
        "请严格按照以下执行步骤撰写文案：\n\n"
        "## 执行步骤\n"
        "{execution_steps}\n\n"
        "## 硬性质量标准\n"
        "{quality_constraints}\n\n"
        "## 参考文案\n"
        "{reference_examples}\n\n"
        "## 产品信息\n"
        "- 品类：{category}\n"
        "- 标题：{title}\n"
        "- 卖点：{selling_points}\n"
        "- 输出语言：{language}\n"
        "- 目标字数：严格控制在 {target_word_range} 字\n\n"
        "{price_constraint}\n\n"
        "请直接输出文案。"
    ),
)

DOUYIN_SKILLS = [
    DOUYIN_BEAUTY_SKILL,
    DOUYIN_DIGITAL_SKILL,
    DOUYIN_FOOD_SKILL,
    DOUYIN_FASHION_SKILL,
    DOUYIN_SHOES_BAGS_SKILL,
    DOUYIN_WATCH_JEWELRY_SKILL,
    DOUYIN_SMART_HOME_SKILL,
    DOUYIN_MOM_BABY_PET_SKILL,
    DOUYIN_3C_APPLIANCE_SKILL,
    DOUYIN_BOOK_EDU_SKILL,
    DOUYIN_FLOWER_GARDEN_SKILL,
    DOUYIN_SPORTS_OUTDOOR_SKILL,
    DOUYIN_TOY_MUSIC_SKILL,
    DOUYIN_FRESH_FOOD_SKILL,
    DOUYIN_LOCAL_LIFE_SKILL,
    DOUYIN_JEWELRY_SKILL,
    DOUYIN_GENERIC_SKILL,
]
