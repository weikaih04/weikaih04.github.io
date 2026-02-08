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

/* Bio section styling */
.bio-section {
  font-size: 0.95em;
  line-height: 1.6;
  color: #374151;
}

/* Announcement banner styling - match bio font size */
.announcement-banner {
  font-size: 0.95em !important;
}

/* News section styling - match bio font size */
h2 + ul, h2 + ul li {
  font-size: 0.95em;
  line-height: 1.6;
}
</style>

<div class="bio-section">
I am an undergraduate student at the University of Washington, advised by Prof. <a href="http://www.ranjaykrishna.com/index.html">Ranjay Krishna</a>, PhD student <a href="https://jieyuz2.github.io/">Jieyu Zhang</a>, and PhD student <a href="https://zixianma.github.io/">Zixian Ma</a> at <a href="https://raivn.cs.washington.edu/">UW CSE RAIVN Lab</a>. I am also a student researcher at <a href="https://allenai.org/">Allen Institute for AI</a>. I work on computer vision, with a particular interest in <strong>2D/3D/4D detection, tracking, reconstruction, and generation in the wild</strong>, vision-language models, and spatial understanding for embodied AI.
</div>


<div class="announcement-banner">
  📢 I'm applying for PhD programs in the 2027 cycle. Feel free to <a href="mailto:weikaih@cs.washington.edu">reach out</a>!
</div>

## 📰 News
- [2026-1] Our work [Generate Any Scene](https://generate-any-scene.github.io/) is accepted to ICLR 2026.
- [2024-9] Our work [Task Me Anything](https://www.task-me-anything.org/) is accepted to NeurIPS 2024.
- [2024-7] Our work [m&m's: A Benchmark to Evaluate Tool-Use for multi-step multi-modal Tasks](https://arxiv.org/abs/2403.11085) is accepted to ECCV 2024.

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

## 🏅 Awards
- UW CSE John and JoAnne Wisniewski Endowed Scholarship 2024

## 📍 Professional Services
- Organizer of the **Synthetic Data for Computer Vision Workshop** at CVPR 2024 and CVPR 2025 ([website](https://syndata4cv.github.io/))
- TA for **UW CSE 455: Computer Vision**, Autumn 2025 ([course page](https://courses.cs.washington.edu/courses/cse455/))
- TA for **UW CSE 493G: Deep Learning**, Winter 2026 ([course page](https://courses.cs.washington.edu/courses/cse493g1/26wi/))
- TA for **UW CSE 493G: Deep Learning**, Spring 2025 ([course page](https://courses.cs.washington.edu/courses/cse493g1/25sp/))

## 📫 Contact
Email: weikaih@cs.washington.edu
<br>Twitter (X): [@weikaih04](https://twitter.com/weikaih04)
<br>Instagram: [@weikaih04](https://www.instagram.com/weikaih04/)
<br>Linkedin: [Weikai Huang](https://www.linkedin.com/in/weikaihuang/)
<br>Wechat: hwk18105962347

