---
layout: default
---

<style>
/* 移动端优化样式 */
@media screen and (max-width: 768px) {
  /* 调整flex容器在移动端的布局 */
  div[style*="display: flex"] {
    flex-direction: column !important;
  }
  
  /* 确保图片在移动端占满宽度 */
  div[style*="display: flex"] img {
    width: 100% !important;
    max-width: 100% !important;
    margin-right: 0 !important;
  }
  
  /* 文本内容的最小宽度调整 */
  div[style*="min-width: 250px"] {
    min-width: 100% !important;
    margin-top: 0 !important;
  }
}

/* 防止图片加载时的抖动 */
img {
  aspect-ratio: attr(width) / attr(height);
}
</style>

Hi, I am an undergrad at the University of Washington, advised by Prof. [Ranjay Krishna](http://www.ranjaykrishna.com/index.html), PhD student [Jieyu Zhang](https://jieyuz2.github.io/), and PhD student [Zixian Ma](https://zixianma.github.io/) at [UW CSE RAIVN Lab](https://raivn.cs.washington.edu/). Currently I am also a student collaborator at [Allen Institute for AI](https://allenai.org/) working on VLM training and data generation.

**Research Interests**:

- **2D and 3D Grounding and Tracking**: Developing robust object detection, grounding and tracking systems that can understand spatial relationships and temporal dynamics across different modalities, with applications in autonomous systems and embodied AI.

- **Controllable Generative Models**: Building controllable and interpretable generative models for visual content creation, enabling precise control over generated outputs through structured representations and programmatic interfaces.

- **Compositional and Scalable Synthetic Visual Data Generation**: Creating programmable and scalable synthetic data generation pipelines for computer vision tasks, focusing on scene graph programming and domain-specific data augmentation to improve model performance and generalization.

- **Vision and Spatial centric VLM**: Advancing vision-language models to better understand complex spatial reasoning, multi-step visual tasks, and tool-use scenarios, bridging the gap between visual perception and actionable intelligence.

<!-- I am looking for co-first or leading-author-level collaborators for projects over the coming years. If you are interested, please feel free to reach out. -->

## 📝 Publications

<div class="section-header">
  <span style="font-size: 0.9em; color: #6b7280;">(* denotes equal contribution)</span>
  <div class="view-toggle">
    <button id="selectedBtn" class="active">Selected</button>
    <button id="allBtn">All Publications</button>
  </div>
</div>

<div id="publicationsList" class="publications-list">
  <!-- Publications will be loaded here dynamically -->
</div>

## 🎓 Education
- **University of Washington**  
  *B.S. in Computer Science, Minor in Applied Mathematics and Music*  
  2023 – 2027 (Expected)
  
## 📰 News
- [2024-9] Our work [Task Me Anything](https://www.task-me-anything.org/) is accepted to NeurIPS 2024.
- [2024-7] Our work [m&m's: A Benchmark to Evaluate Tool-Use for multi-step multi-modal Tasks](https://arxiv.org/abs/2403.11085) is accepted to ECCV 2024.
  
## 🏅 Awards
- UW CSE John and JoAnne Wisniewski Endowed Scholarship 2024

## 📍 Professional Services
- Organizer of the **Synthetic Data for Computer Vision Workshop** at CVPR 2024 and CVPR 2025 ([website](https://syndata4cv.github.io/))
- TA for **UW CSE 455: Computer Vision**, Autumn 2025 ([course page](https://courses.cs.washington.edu/courses/cse455/))
- TA for **UW CSE 493G: Deep Learning**, Spring 2025 ([course page](https://courses.cs.washington.edu/courses/cse493g1/25sp/))

## 📫 Contact
Email: weikaih@cs.washington.edu
<br>Twitter (X): [@weikaih04](https://twitter.com/weikaih04)
<br>Instagram: [@weikaih04](https://www.instagram.com/weikaih04/)
<br>Linkedin: [Weikai Huang](https://www.linkedin.com/in/weikaihuang/)
<br>Wechat: hwk18105962347

