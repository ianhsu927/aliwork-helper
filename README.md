# Aliwork-helper: 宜搭前端 JS 工具代码库

本仓库提供了了一些钉钉宜搭前端 JS 开发常用的工具方法，包括跨应用数据源 API 封装、UI 工具函数、字段值处理、常用场景封装等，旨在提高宜搭前端开发效率。

## 文档

文档使用 JSDoc 生成，可以在当前仓库的 docs 目录下只找到，或者[查看在线文档](https://hackingzhang.github.io/aliwork-helper/)。

## 如何使用

**推荐使用[代码模板](#代码模板)来组织宜搭 JS 代码**

1. ## 引入 JS 库

   **我们不提供本库的 CDN 或者公共访问托管，请自行解决托管问题**  
   在 didMount 函数中加入以下代码来加载 Aliwork-helper：

   ```Javascript
   this.utils.loadScript("url-to-aliwork-helper.min.js").then(() => {
      // 加载完成后会暴露 Awh 全局变量，所有方法函数/类均可以通过 Awh.xxx 访问
      console.log(Awh);
      Awh.dialog(this, "show"， "提示", "加载完成");
   });
   ```

   一般情况下，只需要在 didMount 中加载一次即可全局访问 Awh。但是，如果有以下情况，则建议像上面那样先加载再调用，以免因为库文件未加载完成而报错。

   - 代码逻辑需要在页面加载完成后立即调用本库做一些事情
   - 组件设置了除“自定义”之外的默认值（通过快捷配置、公式或者数据联动），同时设置了 onChange 事件，且需要在事件回调中调用本库

2. ## 复制源码到宜搭 JS 面板
   找到需要的方法函数源代码，然后将整个函数定义复制到宜搭设计器动作面板。  
   在文档中可以通过下面的方法找到函数源码：  
   每一个方法参数列表下方都有一个 View Source 按钮，后面跟着方法所在的源文件和在源文件中的行数，如下图：  
   ![定位源代码](https://hackingzhang.github.io/aliwork-helper/assets/how-to-locate-source-code.png)  
   点击行数即可跳转到源码页面。  
   ![定位源代码](https://hackingzhang.github.io/aliwork-helper/assets/locate-source-code.png)

## 代码模板

### 宜搭 JS 模板

在使用宜搭 JS 实现复杂业务场景时，一不小心就会写出几千行的代码，而宜搭 JS 不支持模块化（当然，
可以引入外部 JS），所以如何在单个文件内组织业务代码对应用的可维护性至关重要。推荐使用下面的模板来组织宜搭 JS 代码。

```Javascript
/**
* 尊敬的用户，你好：页面 JS 面板是高阶用法，一般不建议普通用户使用，如需使用，请确定你具备研发背景，能够自我排查问题。当然，你也可以咨询身边的技术顾问或者联系宜搭平台的技术支持获得服务（可能收费）。
* 我们可以用 JS 面板来开发一些定制度高功能，比如：调用阿里云接口用来做图像识别、上报用户使用数据（如加载完成打点）等等。
* 你可以点击面板上方的 「使用帮助」了解。
*/

/* -------------------------------------------------------------------------- */
/*                                  通用工具函数/类                                  */
/* -------------------------------------------------------------------------- */



/* -------------------------------------------------------------------------- */
/*                                   具体业务代码                                   */
/* -------------------------------------------------------------------------- */


/* ------------------ 建议将处理同一业务逻辑的代码组织在一起，不同业务逻辑之间用单行注释块分隔，就像这样 ------------------ */



/* -------------------------------------------------------------------------- */
/*                                  生命周期钩子函数                             */
/* -------------------------------------------------------------------------- */

// 当页面渲染完毕后马上调用下面的函数，这个函数是在当前页面 - 设置 - 生命周期 - 页面加载完成时中被关联的。
export function didMount() {
  console.log(`「页面 JS」：当前页面地址 ${location.href}`);
  // console.log(`「页面 JS」：当前页面 id 参数为 ${this.state.urlParams.id}`);
  // 更多 this 相关 API 请参考：https://www.yuque.com/yida/support/ocmxyv#OCEXd
  // document.title = window.loginUser.userName + ' | 宜搭';
}

```

### 子表值变更事件处理函数模板

```Javascript
/**
 * 子表数据变更事件模板
 * @param {object} param0
 */
export function onSubformChange({ extra }) {
  if (!extra) {
    // TODO: 当通过JS设置子表数据时执行
  }
  if (extra && extra.from === "add_item") {
    // TODO: 当点击子表新增按钮时执行
  }
  if (extra && extra.from === "del_item") {
    // TODO: 当点击子表删除按钮时执行
  }
  if (extra && extra.from === "copy_item") {
    // TODO: 当点击子表复制按钮时执行
  }
  if (extra && extra.from === "form_change") {
    // TODO: 当子表某个字段值变更时执行

    // 获取数据变更行下标
    // const changeItemIndex = getSubformItemIndex(this, extra.formGroupId, extra.tableFieldId);

    if (extra.fieldId === "textField_xxxxxx") {
      // TODO: 匹配特定字段值变更时执行
    }
  }
}
```
