---
title: "A Brief Introduction to Wavefront Shaping: Controlling Disorder with Disorder"
date: 2026-05-11
lang: en
excerpt: "A brief introduction to wavefront shaping, from adaptive optics and guide stars to computational WFS, NeuWS, and NeOTF."
image: https://picx.zhimg.com/v2-15140b06f0da2e4e1ab8c013b20cec39_1440w.jpg
image_alt: "Wavefront shaping"
tags:
  - notes
  - math
---

# A Brief Introduction to Wavefront Shaping: Controlling Disorder with Disorder

**Author**: never mind (Ph.D. student @ computational imaging and low-level vision)

## 1. History: starting from adaptive optics

If we want to talk about wavefront shaping (WFS), I do not think we should begin directly with scattering media. A better starting point is adaptive optics (AO).

The original motivation behind AO was very simple. When a ground-based telescope looks at stars, starlight passes through atmospheric turbulence before reaching the telescope. The wavefront becomes distorted, and the image becomes blurred. A natural question is: can we measure this wavefront distortion in real time, and then use a deformable mirror to compensate for it? Babcock proposed this idea as early as 1953 [1]. Later, as deformable mirrors, wavefront sensors, and laser guide stars matured, AO became an important tool in astronomy, retinal imaging, and high-resolution microscopy.

A typical AO pipeline is:

distorted wavefront -> wavefront sensor measures aberration -> deformable mirror corrects it -> image quality improves

The key concept here is the **guide star**. You need a known point source or reference target to tell you what the current wavefront distortion looks like. In astronomy, this can be a real star or an artificial sodium-layer laser guide star. In microscopy, it can be a fluorescent bead, a reflective point, or some other readable feedback signal.

The problem in scattering media, however, is much more extreme than ordinary AO.

AO usually handles low-order aberrations, such as defocus, astigmatism, coma, or a finite number of Zernike modes. Strong scattering media do not give you a few dozen aberration coefficients. They give you a seemingly random speckle field. Ordinary AO corrects a "blurred wavefront", whereas scattering wavefront shaping controls a multimode propagation process that has been almost completely scrambled.

In 2007, Vellekoop and Mosk performed a classic experiment: they used an SLM to control the incident wavefront, making the speckles behind a strongly scattering medium interfere constructively at a target point and form a focus much brighter than the background [2]. The paper is short, but it essentially opened the modern wavefront shaping research direction.

The intuition is simple. Suppose the input side has many controllable modes. After passing through the scattering medium, each mode contributes a complex amplitude at the target point:

$$
E_i = A_i e^{j\phi_i}
$$

Without phase control, these complex numbers add randomly, producing an ordinary speckle pattern. If we align the phase of every contribution:

$$
E_{\text{focus}} = \sum_i A_i
$$

then the intensity at the target point increases significantly.

So the essence of wavefront shaping is not to "remove scattering". It is to exploit the deterministic nature of a scattering medium and reorganize an apparently random speckle field into a controllable optical field.

## 2. Two axes: guide-star-based and physical/computational WFS

Wavefront shaping can quickly become confusing, because different papers solve different problems, use different feedback signals, and sometimes physically modulate the incident light with an SLM, while other times only reconstruct the image computationally.

I find it useful to separate the field along two axes.

**The first axis is:**

guide-star assisted <-> guide-star-free

That is, do you need an explicit reference point, target signal, matrix calibration signal, or some other readable internal/external feedback?

**The second axis is:**

physical WFS <-> computational WFS

That is, do you actually reshape the optical field in the physical world, or do you only compensate for scattering-induced degradation computationally?

These two axes are not completely independent, but they help clarify the direction of the field:

- from guide-star-assisted to guide-star-free;
- from physical WFS to computational WFS.

The former aims for less invasiveness and less auxiliary prior information. The latter aims for lower hardware complexity and stronger digital reconstruction. But no category is free of cost. Every method has its own trade-off.

## 3. Guide-star assisted vs. guide-star-free

### 3.1 Guide-star-assisted physical WFS: the most direct route, and the closest to traditional AO

The most naive scattering WFS procedure looks like this:

1. Place a feedback target point behind or inside the scattering medium.
2. Change the phase pattern on the SLM/DMD.
3. Check whether the target point becomes brighter.
4. Keep the change if it improves the signal; discard it otherwise.
5. Repeat many times until a focus forms at the target point.

This target point is the guide star. The benefit is that the objective function is extremely clear:

$$
\max_x I_{\text{target}}(x)
$$

where $x$ is the incident wavefront and $I_{\text{target}}$ is the feedback intensity at the guide star.

If you have this feedback, the optimization problem becomes straightforward. You can use sequential optimization, phase stepping, genetic algorithms, or SPGD. In essence, all of them ask the same question: **does the current wavefront make the guide star brighter?**

The problem with guide stars is also obvious: they are often unnatural.

If the guide star is a fluorescent bead, you have to place the bead inside the sample. If it is nonlinear fluorescence, the system complexity and excitation power both increase. If it is an ultrasound guide star, the resolution is often limited by the acoustic focus. If it is a photoacoustic guide star, the system becomes a hybrid optical-acoustic system.

So the core tension in early WFS was:

- with a guide star, the problem is easy, but the system is not natural;
- without a guide star, the system is natural, but the problem becomes a blind inverse problem.

#### TM and RM: also broadly guide-star-assisted WFS

Transmission matrix (TM) and reflection matrix (RM) methods are often discussed separately. In this article, I prefer to place them under the broader category of *guide-star-assisted / measurement-assisted WFS*.

The reason is that TM/RM methods may not require a literal fluorescent bead or acoustic focus, but they still need a clear measurement channel that tells you how each input mode maps to the output complex field. The output camera, reference arm, or reflection-matrix acquisition system is essentially a generalized guiding signal.

For a coherent linear system, the input and output complex fields can be written as:

$$
\mathbf{y} = T\mathbf{x}
$$

where $\mathbf{x}$ is the input wavefront, $\mathbf{y}$ is the output complex field, and $T$ is the transmission matrix.

In 2010, Popoff et al. performed a classic optical transmission matrix measurement in PRL. They controlled input modes with an SLM and measured the output complex field at the camera using full-field interferometric measurement, obtaining the monochromatic transmission matrix of a thick random scattering sample [3].

The advantage of TM is clean and powerful: once we know $T$, focusing onto the $j$-th output pixel only requires taking the phase conjugate of the $j$-th row of $T$:

$$
\mathbf{x}_{\text{focus}} = \exp\left(-j\arg(T_{j,:})\right)
$$

So TM turns WFS from black-box optimization into linear algebra.

Reflection matrix methods are another important route. In practical biological microscopy, we usually cannot put a camera behind the sample; we can only illuminate and detect from the same side. In that case, RM is more natural than TM. Laser scanning reflection-matrix microscopy from Wonshik Choi's group is a representative example. They record the amplitude and phase of reflected waves, not only at the confocal point but also at non-confocal points, thereby constructing a reflection matrix and estimating spatially varying angular aberrations [4].

The strength of TM/RM is the amount of information they provide. Once the matrix is measured, you can perform single-point refocusing, multipoint focusing, imaging, aberration correction, virtual confocal microscopy, and even analyze scattering structures in the medium itself.

The weakness is equally clear: **the matrix is huge**. If the input has $N_{in}$ modes and the output has $N_{out}$ modes, the full matrix size is:

$$
N_{out} \times N_{in}
$$

When $N_{in}$ and $N_{out}$ reach hundreds of thousands or millions, acquiring, storing, decomposing, and inverting the full TM/RM becomes a heavy engineering problem. More realistically, many samples are dynamic. By the time you finish measuring a complete matrix, the medium may already have decorrelated.

So the core trade-off of TM/RM is:

- they give us the most complete control;
- but the price is the most complete measurement.

#### Acoustic and photoacoustic guide stars: putting the guide star inside tissue

To avoid placing a real bead inside tissue, people began searching for "virtual guide stars".

A classic direction is TRUE, or time-reversed ultrasonically encoded optical focusing. The basic idea is to use focused ultrasound to modulate the scattered light passing through the acoustic focus. Only the light passing through this ultrasound region receives a frequency tag. Then, by time-reversing or phase-conjugating the tagged light, we can focus light back to the acoustic focus [6].

The common point of these methods is that they do not completely eliminate the guide star. Instead, they replace a real optical point source with acoustic, photoacoustic, or nonlinear feedback.

### 3.2 Guide-star-free WFS: replacing guide stars with priors

#### Memory-effect-based methods

The first important truly guide-star-free direction is the optical memory effect.

A scattering medium seems to scramble light completely, but not all correlations disappear. For a thin scattering layer, if the incident angle changes slightly, the output speckle pattern does not become totally random. Instead, it shifts in a correlated way. This angular correlation is the memory effect.

In 2012, Bertolotti et al. used this phenomenon in Nature to achieve non-invasive imaging of fluorescent objects hidden behind a scattering layer [7]. The core idea is that the autocorrelation of the scattered speckle contains the autocorrelation of the object, from which the object can be recovered using phase retrieval.

Katz et al. later pushed speckle-correlation imaging in a more practical direction [8]. As long as the scattering medium satisfies the memory-effect condition, the scattering pattern contains usable information.

So the core trade-off of memory-effect methods is:

- non-invasive, simple, and elegant;
- but dependent on a clear scattering prior, namely that the system is approximately shift-invariant within a certain range.

#### Image-guided methods

If we optimize image quality instead of a single point, we arrive at image-guided wavefront shaping.

In 2021, Ori Katz's group proposed guide-star-free image-guided wavefront shaping in Science Advances [9]. They used an image-quality metric directly as the feedback signal and let the system search for a wavefront that improves the image.

Traditional guide-star optimization solves:

$$
\max_x I(r_0)
$$

Image-guided WFS solves:

$$
\max_x Q(\text{image})
$$

where $Q$ can be sharpness, contrast, spectral energy, sparsity, or another quality metric.

Therefore, the trade-off of guide-star-free physical WFS is:

- it avoids a real point guide star;
- but it requires a reliable image-quality objective function.

## 4. Physical vs. computational WFS

**Physical WFS** actually changes the incident optical field. You use an SLM, DMD, or similar device to reshape light in the physical world.

* **Advantages**: it can truly increase the optical intensity at the target; improve photon efficiency for downstream detection; and support tasks such as optical stimulation, where real energy delivery matters.
* **Disadvantages**: it requires complex modulators and optical setups; the speed is limited by hardware; and it demands strong system stability.

**Computational WFS** does not necessarily change the incident light. Instead, it compensates for scattering-induced degradation in computation.

* **Advantages**: it avoids expensive and complex SLM hardware; can reconstruct images with ordinary cameras; and is easier to combine with neural representations, phase retrieval, and deconvolution.
* **Fundamental limitation**: it cannot concentrate optical energy at the target the way physical WFS can. It can improve the reconstructed image quality, but it cannot increase the real photon budget at the sample.

### 4.1 Computational WFS: wavefront shaping in the digital world

Computational WFS does not place a real SLM in the optical path. Instead, it simulates a "virtual SLM" in computation.

Ori Katz's group used holographically measured scattered fields to simulate a virtual SLM computationally [10]. YoonSeok Baek et al. used spatially incoherent light to extract mutually incoherent scattered fields for digital phase conjugation [11].

NeuWS is also a form of computational WFS [12]. It combines maximum likelihood estimation with neural signal representation, aiming to reconstruct diffraction-limited images without a guide star.

The core trade-off of neural computational WFS is:

- it can absorb complex priors;
- but it may also turn a physical problem into an opaque statistical reconstruction problem.

### 4.2 NeOTF: simplifying the objective into a Fourier-amplitude constraint

The starting point of NeOTF is that many through-scattering imaging methods are essentially trying to estimate the OTF or PSF of a system [13].

Compared with NeuWS, a key difference of NeOTF is that it does not introduce a complicated neural loss. Instead, it replaces the objective function with a simpler **Fourier-amplitude constraint**.

This has several benefits: the objective is simpler; it does not need to directly impose complex priors on the target image; and it can handle low-SNR and broadband incoherent illumination more naturally.

So the trade-off of NeOTF is:

- it avoids real SLM hardware and complex physical wavefront control;
- but it relies on a computable OTF imaging model.

## 5. Comparison of mainstream methods

| Method | Needs guide star? | Physically modulates light? | Main advantage | Main trade-off |
| :--- | :--- | :--- | :--- | :--- |
| Traditional AO | Requires guide star / WFS | Yes | Physical correction; improves real SNR | Mainly suitable for low-order aberrations |
| Traditional point-optimization WFS | Requires target feedback | Yes | Clear objective; strong focusing | Needs a real feedback point |
| TM / RM | Requires matrix measurement signal | Yes | Complete control; arbitrary-point focusing | Large matrix, slow acquisition, requires stability |
| Ultrasound / PA | Requires virtual guide star | Yes | Can form feedback inside tissue | Complex system; resolution/speed limited |
| Memory-effect imaging | No explicit guide star | No or weakly | Non-invasive, simple, can be single-shot | Relies on the memory-effect prior |
| Image-guided WFS | No point guide star | Yes | Uses image quality as feedback | Metric may be unreliable |
| Computational WFS | No real SLM | No | Avoids complex hardware; scalable optimization | Cannot truly improve photon budget at sample |
| NeuWS / NeOTF | No guide star | No | Flexible neural representation; suitable for complex reconstruction | Relies on models and priors; optical energy is not redistributed |

The most important point in this table is: **guide-star-free does not mean prior-free. Computational WFS is also not a complete replacement for physical WFS.**

## 6. Future directions: from "is there a guide star?" to "is the prior trustworthy?"

The central question of the field is no longer merely whether we have a guide star. It is: **is the prior trustworthy?**

Memory effect, OTF models, image-quality metrics, neural representations, and low-rank structures in TM/RM are all priors. For complex volumetric scattering samples, imposing the wrong prior can cause imaging to fail rather than improve.

One important future direction is **model-agnostic operator learning**. That is, instead of assuming from the beginning that a scattering medium must be convolutional or follow a particular model, we should use weaker priors to explicitly recover or implicitly learn an interpretable and verifiable input-output operator.

Besides model accuracy, another core challenge is the **decorrelation time**.

## 7. Summary

The development of wavefront shaping can be viewed as a process in which feedback and priors become increasingly abstract.

At first, people used real bright points. Later, acoustic and photoacoustic methods turned them into virtual signals. TM/RM methods then converted the problem into measurable matrices. Memory-effect methods transformed hidden correlations into constraints. Finally, computational WFS moved wavefront shaping into the digital world.

Physical WFS and computational WFS are two different strategies:

- physical WFS pursues real energy delivery and real signal enhancement;
- computational WFS pursues lower hardware cost and digital reconstruction capability.

The next core question may be: **in an unknown, dynamic, large-scale, and incompletely measurable scattering system, how can we quickly learn a sufficiently accurate physical operator?** This is also why the field matters: it approaches the fundamental problem of controllable information transmission through complex media.

## References

[1] H. W. Babcock, "The Possibility of Compensating Astronomical Seeing," *PASP* 65, 229-236 (1953).

[2] I. M. Vellekoop and A. P. Mosk, "Focusing coherent light through opaque strongly scattering media," *Optics Letters* 32(16), 2309-2311 (2007).

[3] S. M. Popoff, et al., "Measuring the transmission matrix in optics..." *Physical Review Letters* 104, 100601 (2010).

[4] S. Yoon, et al., "Laser scanning reflection-matrix microscopy..." *Nature Communications* 11, 5721 (2020).

[5] A. Boniface, et al., "Non-invasive focusing and imaging in scattering media with a fluorescence-based transmission matrix," *Nature Communications* 11, 6154 (2020).

[6] X. Xu, et al., "Time-reversed ultrasonically encoded optical focusing into scattering media," *Nature Photonics* 5, 154-157 (2011).

[7] J. Bertolotti, et al., "Non-invasive imaging through opaque scattering layers," *Nature* 491, 232-234 (2012).

[8] O. Katz, et al., "Non-invasive single-shot imaging through scattering layers..." *Nature Photonics* 8, 784-790 (2014).

[9] T. Yeminy and O. Katz, "Guidestar-free image-guided wavefront shaping," *Science Advances* 7, eabf5364 (2021).

[10] O. Haim, et al., "Image-guided computational holographic wavefront shaping," *Nature Photonics* 19, 44-51 (2025).

[11] Y. Baek, et al., "Phase conjugation with spatially incoherent light in complex media," *Nature Photonics* 17, 1114-1119 (2023).

[12] B. Y. Feng, et al., "NeuWS: Neural wavefront shaping for guidestar-free imaging..." *Science Advances* 9, eadg4671 (2023).

[13] Y. Sun and F. Xia, "NeOTF: guidestar-free neural representation for broadband dynamic imaging through scattering," *Advanced Photonics* 8(3), 036007 (2026).
