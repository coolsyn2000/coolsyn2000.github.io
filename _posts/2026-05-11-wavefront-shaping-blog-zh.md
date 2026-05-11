---
title: "浅谈波前整形：以乱制乱"
date: 2026-05-11
lang: zh
ref: wavefront-shaping-blog
permalink: /blog/zh/wavefront-shaping-blog/
excerpt: "浅谈波前整形：以乱治乱"
image: https://picx.zhimg.com/v2-15140b06f0da2e4e1ab8c013b20cec39_1440w.jpg
image_alt: "Yunong Sun"
tags:
  - notes
  - math
---
# 浅谈波前整形：以乱制乱

**作者**: never mind (Ph.D student @ 计算成像&底层视觉)

## 1. 历史：从 Adaptive Optics 开始

如果要讲 Wavefront Shaping（波前整形，WFS），我觉得不能直接从散射介质开始讲，而应该先从 Adaptive Optics（自适应光学，AO）开始讲。

AO 最早的动机非常朴素：地面望远镜看星星，星光穿过大气湍流后，波前被扭曲了，成像就会模糊。一个自然的问题是，能不能实时测量这个波前畸变，然后用一面可以形变的镜子把它补偿回来？Babcock 在 1953 年就提出了这种想法 [1]。后来随着 deformable mirror、wavefront sensor、laser guide star 等技术成熟，AO 成为了天文成像、眼底成像、高分辨显微中的重要工具。

AO 的典型结构是：
待校正波前 → wavefront sensor 测量像差 → deformable mirror 校正 → 成像质量提高

这里最关键的概念是 **guide star**。你需要一个已知的点源或者参考目标来告诉你：当前波前到底被扭曲成了什么样。天文中可以是真实星星，也可以是激光激发的大气钠层人工星；显微中可以是荧光 bead、反射点、或者某种可读出的反馈信号。

但是散射介质中的问题比普通 AO 更极端。

AO 通常处理的是低阶像差，比如 defocus、astigmatism、coma，或者有限阶的 Zernike 模式。而强散射介质给你的不是几十个像差系数，而是一个看起来近似随机的 speckle field。普通 AO 是在矫正“模糊的波前”，而 scattering wavefront shaping 是在控制“几乎完全打乱的多模传播”。

2007 年，Vellekoop 和 Mosk 做了一个非常经典的实验：他们用 SLM 控制入射波前，让强散射介质后的 speckle 在某个目标点相干叠加，最后形成一个远亮于背景的 focus [2]。这篇文章很短，但是它基本打开了现代 wavefront shaping 的研究路线。

它背后的直觉其实很简单。假设入射端有很多个可控模式，每个模式经过散射介质后都会在目标点贡献一个复振幅：
$$E_i = A_i e^{j\phi_i}$$

如果不控制相位，这些复数随机相加，结果就是普通 speckle。如果我们把每一路的相位都调成一致：
$$E_{\text{focus}} = \sum_i A_i$$

那么目标点的光强就会显著提升。

所以 wavefront shaping 的本质不是“消除散射”，而是利用散射介质的确定性，把本来随机的 speckle 重新组织成可控光场。

## 2. 两种分类：guide-star 与 physical/computational WFS

Wavefront shaping 这个领域很容易越看越乱，因为不同文章解决的问题不同，使用的反馈信号不同，有的真的用 SLM 改变入射光，有的只是计算上重建图像。

比较清楚的分类有两条轴：

**第一条轴是：**
guide-star assisted ←→ guide-star-free
也就是：你是否需要一个明确的参考点、目标信号、矩阵标定信号，或者某种可读出的内部/外部反馈。

**第二条轴是：**
physical WFS ←→ computational WFS
也就是：你是否真的在物理世界中 reshape 光场，还是只在计算中补偿散射造成的退化。

这两条轴不是完全独立，但它们能帮助我们理解这个领域的发展趋势：
- 从 guide-star 到 guide-star-free
- 从 physical WFS 到 computational WFS

前者追求更少的侵入性和更少的先验辅助；后者追求更低的硬件复杂度和更强的数字重建能力。但是没有哪一类方法是免费的。每种方法都有 trade-off。

## 3. Guide-star V.S Guide-star free

### 3.1 Guide-star assisted physical WFS：最直接，也最像传统 AO

最 naive 的 scattering WFS 是这样的：
1. 在散射介质后面，或者散射介质内部，放一个可以提供反馈的目标点；
2. 改变 SLM/DMD 上的相位；
3. 看目标点亮不亮；
4. 更亮就保留，不亮就丢掉；
5. 重复很多次，直到目标点形成一个 focus。

这个目标点就是 guide-star。这个方法的好处是目标函数非常明确：
$$\max_x I_{\text{target}}(x)$$
其中 $x$ 是入射波前，$I_{\text{target}}$ 是 guide-star 处的反馈强度。

如果你有这个反馈，优化问题就很直接。可以用 sequential optimization，可以用 phase stepping，可以用 genetic algorithm，也可以用 SPGD。它们本质上都是在问：**当前这个波前，会不会让 guide-star 更亮？**

但是 guide-star 的问题也很明显：它经常不自然。
如果 guide-star 是荧光 bead，那你得把 bead 放进去；如果是非线性荧光，那系统复杂度和激发功率都会上升；如果是 ultrasound guide-star，分辨率往往受 acoustic focus 限制；如果是 photoacoustic guide-star，系统又变成了光声联合系统。

所以最早期 WFS 的核心矛盾是：
- 有 guide-star，问题好解，但系统不自然；
- 没有 guide-star，系统自然，但问题突然变成 blind inverse problem。

#### TM 和 RM：也属于广义 guide-star assisted WFS
Transmission Matrix（TM）和 Reflection Matrix（RM）方法经常会被单独拿出来讲。但在我这篇文章的分类里，我倾向于把它们放在 *guide-star assisted / measurement-assisted WFS* 这一侧。

原因是：TM/RM 虽然不一定需要一个真实的荧光 bead 或声学焦点，但它仍然需要一个明确的测量通道来告诉你每个输入模式对应的输出复场是什么。这个输出相机、参考光路、反射矩阵采集系统，本质上就是一种广义的“导引信号”。

对于相干线性系统，输入和输出复场可以写成：
$$\mathbf{y} = T\mathbf{x}$$
其中 $\mathbf{x}$ 是输入波前，$\mathbf{y}$ 是输出复场，$T$ 是 transmission matrix。

Popoff 等人在 2010 年 PRL 里做了非常经典的 optical transmission matrix measurement。他们用 SLM 控制输入模式，同时用 full-field interferometric measurement 在相机端测量复场，从而得到厚随机散射样品的 monochromatic transmission matrix [3]。

TM 的优点很干净：一旦我知道了 $T$，想聚焦到第 $j$ 个输出像素，只需要取 $T$ 的第 $j$ 行做相位共轭：
$$\mathbf{x}_{\text{focus}} = \exp\left(-j\arg(T_{j,:})\right)$$

所以 TM 方法把 WFS 从黑箱优化变成了线性代数。

Reflection Matrix 则是另一条非常重要的路线。实际生物显微中，我们通常不能把相机放到样品后面，只能从同一侧照明和检测。这时候 RM 就比 TM 更自然。韩国 Wonshik Choi 组的 laser scanning reflection-matrix microscopy 是代表性工作。他们记录反射波的振幅和相位，不只记录 confocal 点，也记录 non-confocal 点，从而构造 reflection matrix，并计算局部变化的 angular aberration [4]。

TM/RM 的好处是信息量非常大。一旦矩阵测出来，你不仅可以做单点 refocus，也可以做多点聚焦、成像、像差校正、虚拟共聚焦、甚至分析介质本身的 scattering structure。

但问题也非常明显：**矩阵太大**。如果输入有 $N_{in}$ 个模式，输出有 $N_{out}$ 个模式，那么完整矩阵大小就是：
$$N_{out} \times N_{in}$$

当 $N_{in}$ 和 $N_{out}$ 进入十万、百万级别，完整 TM/RM 的采集、存储、SVD、反演都会变成很重的工程问题。更现实的是，很多样品是动态的。你花很久测完一个完整矩阵，介质可能已经 decorrelate 了。

所以 TM/RM 的核心矛盾是：
- 它给了我们最完整的控制权；
- 但代价是最完整的测量。

#### 声学和光声 guide-star：把导星放进组织里
为了避免真的在组织内部放一个 bead，人们开始寻找“虚拟 guide-star”。
一个经典方向是 TRUE，也就是 time-reversed ultrasonically encoded optical focusing。它的基本思想是：用聚焦超声调制经过声学焦点的散射光，只有穿过这个超声区域的光会被打上频率标签。然后我们把被标记的光做时间反演或相位共轭，就可以把光重新聚焦回声学焦点 [6]。

这类方法的共同点是：它们没有完全摆脱 guide-star，而是把 guide-star 从真实光学点源变成了声学、光声或非线性反馈。

### 3.2 Guide-star-free WFS: 用先验信息代替导星

#### Memory-effect based
真正 guide-star-free 的第一条重要路线是 optical memory effect。
散射介质看起来会把光完全打乱，但并不是所有相关性都消失。对于薄散射层，如果入射角轻微改变，输出 speckle 不会完全随机重排，而是会发生一个相关的平移。这个角度相关性就是 memory effect。

Bertolotti 等人在 2012 年 Nature 里利用这个现象，实现了隐藏在散射层后荧光物体的 non-invasive imaging [7]。核心思想是：散射 speckle 的 autocorrelation 里包含物体 autocorrelation，然后再通过 phase retrieval 恢复物体。

Katz 等人随后把 speckle correlation 方法推到更实用的方向 [8]。只要散射介质满足 memory effect，散射图案里就有可用信息。

所以 memory-effect 方法的核心矛盾是：
- 非侵入、简单、优雅；
- 但依赖明确的散射先验（要求系统在一定范围内近似 shift-invariant）。

#### Image-guided based
如果不优化某个点，而是优化整张图像质量，这就是 image-guided wavefront shaping。
Ori Katz 组在 2021 年 Science Advances 里提出了 guidestar-free image-guided wavefront shaping [9]。直接用图像质量 metric 作为反馈，让系统寻找能让图像变好的波前。

传统 guide-star 优化的是：
$$\max_x I(r_0)$$
image-guided WFS 优化的是：
$$\max_x Q(\text{image})$$
其中 $Q$ 可以是锐度、对比度、频谱能量、稀疏性等。

所以 guide-star-free physical WFS 的 trade-off 是：
- 它避免了真实导星；
- 但它需要一个可靠的图像质量目标函数。

## 4. Physical V.S Computational WFS

**Physical WFS** 是真的改变入射光场。你用 SLM、DMD 等把光在物理世界中 reshape。
* **优势**：可以真正提升目标处的光强；提高后续探测的 photon efficiency；可以用于光刺激等需要实际能量递送的任务。
* **缺点**：需要复杂调制器和光路；速度受硬件限制；对稳定性要求高。

**Computational WFS** 则不一定真的改变入射光，而是在计算中补偿散射造成的退化。
* **优势**：避免昂贵复杂的 SLM；可用普通相机完成重建；更容易结合神经表示、相位恢复、反卷积。
* **根本限制**：不能像 physical WFS 一样真的把光能集中到目标处。它可以提高重建图像质量，但不能提高样品处真实信号的 photon budget。

### 4.1 Computational WFS：数字世界里的波前整形
Computational WFS 不在光路中放一个真实 SLM，而是在计算中模拟一个“虚拟 SLM”。
Ori Katz 组利用 holographically measured scattered fields 在计算中模拟 virtual SLM [10]。YoonSeok Baek 等人利用 spatially incoherent light 提取 mutually incoherent scattered fields 做 digital phase conjugation [11]。

NeuWS 也是一种 computational WFS [12]，把 maximum likelihood estimation 和 neural signal representation 结合起来，目标是在没有 guide-star 的情况下重建衍射极限图像。
所以 neural computational WFS 的核心矛盾是：
- 它可以吸收复杂先验；
- 但也可能把物理问题变成不透明的统计重建问题。

### 4.2 NeOTF：把目标函数简化成傅里叶幅度约束
NeOTF 的出发点是：很多 through-scattering imaging 方法实际上都在试图估计一个系统的 OTF 或 PSF [13]。
相比 NeuWS，NeOTF 的一个关键区别是：它没有引入复杂的神经损失，而是把 objective function 换成了更简单的 **傅里叶幅度约束**。

这样做的好处是：目标函数更简单；不需要直接假设目标图像的复杂先验；对低 SNR 和宽带非相干照明可以更自然地处理。
所以 NeOTF 的 trade-off 是：
- 它避免了真实 SLM 和复杂物理波前控制；
- 但它依赖一个可计算的 OTF 成像模型。

## 5. 目前主流方法的对比

| 方法 | 是否需要 guide-star | 是否真实调光 | 主要优点 | 主要 trade-off |
| :--- | :--- | :--- | :--- | :--- |
| 传统 AO | 需要 guide star / WFS | 是 | 物理校正，提升真实 SNR | 主要适合低阶像差 |
| 传统 WFS 点优化 | 需要目标反馈 | 是 | 目标函数明确，聚焦强 | 需要真实反馈点 |
| TM / RM | 需要矩阵测量信号 | 是 | 控制能力完整，可任意点聚焦 | 矩阵大、采集慢、系统要稳定 |
| Ultrasound / PA | 需要虚拟导星 | 是 | 可在组织内部形成反馈 | 系统复杂，分辨率/速度受限 |
| Memory-effect 成像 | 不需要显式 guide-star | 否或弱 | 非侵入、简单、可单帧 | 依赖 memory effect 强先验 |
| Image-guided WFS | 不需要点导星 | 是 | 用图像质量做反馈 | metric 可能不可靠 |
| Computational WFS | 不需要真实 SLM | 否 | 避免复杂硬件，可大规模优化 | 不能真实提升样品处光子预算 |
| NeuWS / NeOTF | 不需要 guide-star | 否 | 神经表示灵活，适合复杂重建 | 依赖模型和先验，物理能量不重分配 |

这个表里最重要的一点是：**guide-star-free 并不等于没有先验。computational WFS 也不等于 physical WFS 的完全替代。**

## 6. 未来方向：从“有无导星”到“先验是否可信”

领域接下来的核心问题不再只是有没有 guide-star，而是：**你的先验是否可信？**

Memory effect、OTF、图像质量 metric、神经网络表示、TM/RM 的低秩结构，这些都是先验。对于复杂 volumetric scattering sample，如果施加错误的先验，反而可能让成像失败。

未来一个重要方向是 **model-agnostic 的 operator learning**。也就是说，不要一开始就假设散射介质一定是卷积或者某个特定模型，而是用更弱的先验去显式恢复或者隐式学习一个可解释、可验证的输入输出映射算子。

除了模型准确性，另一个核心挑战是 **去相关时间（Decorrelation time）**。

## 7. 总结

Wavefront shaping 的发展，其实可以看成反馈和先验不断抽象化的过程。
最开始用真实亮点；后来用声学/光声变成虚拟信号；再后来用 TM/RM 变成可测量矩阵；然后利用 memory effect 等变成隐藏的约束；最后 computational WFS 把波前整形搬到了数字世界。

physical WFS 和 computational WFS 像两种不同的策略：
- physical WFS 追求真实能量递送和真实信号提升；
- computational WFS 追求低硬件成本和数字重建能力。

接下来的核心问题可能是：**在未知、动态、大规模、不可完整测量的散射系统中，我们如何快速学习一个足够好的物理算子？** 这也是这个领域逼近复杂介质中可控信息传输这一本质问题的意义所在。

## 参考文献
[1] H. W. Babcock, "The Possibility of Compensating Astronomical Seeing," *PASP* 65, 229–236 (1953).
[2] I. M. Vellekoop and A. P. Mosk, "Focusing coherent light through opaque strongly scattering media," *Optics Letters* 32(16), 2309–2311 (2007).
[3] S. M. Popoff, et al., "Measuring the transmission matrix in optics..." *Physical Review Letters* 104, 100601 (2010).
[4] S. Yoon, et al., "Laser scanning reflection-matrix microscopy..." *Nature Communications* 11, 5721 (2020).
[5] A. Boniface, et al., "Non-invasive focusing and imaging in scattering media with a fluorescence-based transmission matrix," *Nature Communications* 11, 6154 (2020).
[6] X. Xu, et al., "Time-reversed ultrasonically encoded optical focusing into scattering media," *Nature Photonics* 5, 154–157 (2011).
[7] J. Bertolotti, et al., "Non-invasive imaging through opaque scattering layers," *Nature* 491, 232–234 (2012).
[8] O. Katz, et al., "Non-invasive single-shot imaging through scattering layers..." *Nature Photonics* 8, 784–790 (2014).
[9] T. Yeminy and O. Katz, "Guidestar-free image-guided wavefront shaping," *Science Advances* 7, eabf5364 (2021).
[10] O. Haim, et al., "Image-guided computational holographic wavefront shaping," *Nature Photonics* 19, 44–51 (2025).
[11] Y. Baek, et al., "Phase conjugation with spatially incoherent light in complex media," *Nature Photonics* 17, 1114–1119 (2023).
[12] B. Y. Feng, et al., "NeuWS: Neural wavefront shaping for guidestar-free imaging..." *Science Advances* 9, eadg4671 (2023).
[13] Y. Sun and F. Xia, "NeOTF: guidestar-free neural representation for broadband dynamic imaging through scattering," *Advanced Photonics* 8(3), 036007 (2026).