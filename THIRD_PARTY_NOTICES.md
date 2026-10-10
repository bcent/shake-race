# 第三方声明 (Third-Party Notices)

本项目自身代码以 MIT 许可证发布（见 `LICENSE`）。仓库中的 `qr.js` 包含第三方开源代码，声明如下。

## qr.js —— 二维码生成库

`qr.js` 用于在大屏幕上生成"扫码加入"的二维码，全程在浏览器本地完成，不依赖外部网络。它由两层第三方代码组成：

### 1. qrcode-generator（原始算法）

- 作者：Kazuhiko Arase
- 主页：http://www.d-project.com/
- 许可证：MIT

```
Copyright (c) 2009 Kazuhiko Arase

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

"QR Code" 是 DENSO WAVE INCORPORATED 的注册商标。

### 2. qrcode-terminal（Node.js 适配版本）

`qr.js` 中的代码取自 npm 包 `qrcode-terminal` 内置的 `vendor/QRCode` 目录（该目录是对上述库的 Node.js 改写）。

- 作者/贡献者：Gord Tanner、Michael Brooks
- 仓库：https://github.com/gtanner/qrcode-terminal
- 许可证：Apache License 2.0（全文见 `licenses/Apache-2.0.txt`）

**本项目所做的修改**：把该目录下多个 CommonJS 模块合并为一个浏览器可直接加载的脚本，并增加了 `window.qrMatrix(text)` 接口用于返回二维码点阵。算法部分未作改动。

## 运行环境

本项目服务端仅使用 Node.js 内置模块，没有 npm 依赖。
