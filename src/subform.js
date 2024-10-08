/**
 * 子表单相关工具方法
 * @module Subform
 */

import { getFormData } from "./data-source";
import { round } from "./utils";

/**
 * summary 方法 option 参数类型定义
 * @typedef {Object} SubformSummaryOption
 * @property {boolean} ignoreEmpty 是否跳过空数据，默认为true
 * @property {boolean} ignoreDuplicate 是否跳过重复数据，默认为true
 * @property {Function} filter 一个数据过滤函数，接受子表行数据作为参数，返回falsy值跳过当前行
 */

/**
 * setDatas 方法 option 参数类型定义
 * @typedef {Object} SubformSetDatasOption
 * @property {boolean} doNotValidate 是否阻止自动校验，默认为 false
 * @property {boolean} formatted 是否已经格式化，默认为 false
 * @property {boolean} triggerChange 是否触发组件值变化事件，默认为 true
 */

/**
 * 子表工具类，提供子表常用操作方法 <br/>
 *
 * 概念解释： <br/>
 * formGroupId：一个ID字符串，是子表数据项的唯一标识
 */
class Subform {
  /**
   * 创建一个子表工具类实例
   * @param {Object} context this上下文
   * @param {string} tableFieldId 子表唯一标识
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   */
  constructor(context, tableFieldId) {
    this.tableFieldId = tableFieldId;
    this.instance = context.$(tableFieldId);
    if (!this.instance) {
      this.noInstanceError();
    }
  }

  /**
   * 无法获取子表实例报错
   * @private
   */
  noInstanceError() {
    throw Error(`无法获取到唯一标识为${this.tableFieldId}的子表单，请检查标识是否正确`);
  }

  /**
   * 获取子表组件实例
   * @returns {Object} 子表组件实例
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * const tableField = subform.getInstance(); // 等效于 this.$("tableField_xxxxxx");
   * tableField.getValue();
   */
  getInstance() {
    return this.instance;
  }

  /**
   * 获取子表数据列表
   * @returns {Array<Object>} 子表数据列表
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * const dataList = subform.getDatas(); // 等效于 this.$("tableField_xxxxxx").getValue();
   */
  getDatas() {
    return this.instance.getValue();
  }

  /**
   * 设置整个子表的数据
   * @param {Array<Object>} datas 子表数据列表
   * @param {module:Subform~SubformSetDatasOption} [options] 配置项
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * subform.setDatas([...datas]); // 等效于 this.$("tableField_xxxxxx").setValue([...datas]);
   */
  setDatas(datas, options) {
    this.instance.setValue(datas, options);
  }

  /**
   * 获取子表项formGroupId列表
   * @returns {Array<string>} formGroupId列表
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * subform.getFormGroupIds(); // ["tfitem_1", "tfitem_2"]
   */
  getFormGroupIds() {
    return this.instance.getItems();
  }

  /**
   * 根据子表项formGroupId获取子表项索引
   * @param {string} formGroupId formGroupId
   * @returns {number} 索引下标
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * subform.getIndex("tfitem_1"); // 0
   */
  getIndex(formGroupId) {
    const items = this.getFormGroupIds() || [];
    return items.findIndex((item) => item === formGroupId);
  }

  /**
   * 根据子表项索引获取formGroupId
   * @param {number} index 索引下标
   * @returns {string} formGroupId
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * subform.getFormGroupId(0); // "tfitem_1"
   */
  getFormGroupId(index) {
    const items = this.getFormGroupIds() || [];
    return items[index];
  }

  /**
   * 获取子表单行数据
   * @param {string | number} id 可传入行下标或者formGroupId
   * @return {Object} 单行子表数据
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * // 使用索引下标获取数据行
   * subform.getItem(0);
   * // 使用formGroupId获取数据行
   * subform.getItem("tfitem_1");
   */
  getItem(id) {
    if (typeof id === "string") {
      id = this.getIndex(id);
    }
    return this.getDatas()[id];
  }

  /**
   * 更新子表单行数据
   * @param {number | string} id 可传入要更新的行下标或者formGroupId
   * @param {Object} data 要更新的字段值对象
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * // 使用索引下标指示更新数据行
   * subform.updateItem(0, { "tableField_xxxxxx": "new value" });
   * // 使用formGroupId指示更新数据行
   * subform.updateItem("tfitem_1", { "tableField_xxxxxx": "new value" });
   */
  updateItem(id, data) {
    if (typeof id === "number") {
      id = this.getFormGroupId(id);
    }
    this.instance.updateItemValue(id, data);
  }

  /**
   * 汇总子表中指定字段的值
   * @param {string} fieldId 要汇总到主表的子表字段
   * @param {"string" | "number" | "dpt" | "employee"} [dataType] 字段数据类型，默认为string类型
   * @param {module:Subform~SubformSummaryOption} [option] 扩展选项
   * @return {Array<any>} 汇总字段值数组
   *
   * @example
   * const subform = new Subform(this, "tableField_xxxxxx");
   * subform.summary("textField_xxxxxx", "string", { ignoreEmpty: true, ignoreDuplicate: true });
   */
  summary(fieldId, dataType, option) {
    dataType = dataType || "string";
    option = Object.assign(
      {
        ignoreEmpty: true,
        ignoreDuplicate: true,
        filter: () => true,
      },
      option,
    );

    const subformDataList = this.getDatas();

    let sumData = [];
    for (const subformDataItem of subformDataList) {
      const fieldData = subformDataItem[fieldId];

      // 过滤数据
      if (option.filter && option.filter instanceof Function) {
        const goOn = option.filter(subformDataItem);
        if (!goOn) continue;
      }

      // 跳过空数据
      if (option.ignoreEmpty && (fieldData === null || fieldData === undefined)) {
        continue;
      }

      switch (dataType) {
        case "number": {
          let num = Number(fieldData);
          if (isNaN(num)) num = 0;
          sumData.push(num);
          break;
        }
        case "string":
          // 跳过空数据
          if (option.ignoreEmpty && fieldData === "") break;
          // 跳过重复数据
          if (option.ignoreDuplicate && sumData.some((item) => item === fieldData)) {
            break;
          }

          sumData.push(fieldData);
          break;
        case "employee":
          // 多选模式
          if (Array.isArray(fieldData)) {
            for (const employee of fieldData) {
              // NOTICE: 如果是手动选择的成员组件值，员工编号存放在value字段
              // 如果是关联表单填充的成员组件值，则员工编号存放在key字段中
              const workId = employee.value || employee.key;
              if (!workId) continue;
              // 跳过重复数据
              if (
                option.ignoreDuplicate &&
                sumData.some((item) => {
                  const id = item.value || item.key;
                  return id === workId;
                })
              ) {
                continue;
              }
              sumData.push(employee);
            }
          }
          // 单选模式
          else {
            const workId = fieldData.value || fieldData.key;
            // 跳过重复数据
            if (
              option.ignoreDuplicate &&
              sumData.some((item) => {
                const id = item.value || item.key;
                return id === workId;
              })
            ) {
              break;
            }
            sumData.push(fieldData);
          }
          break;
        case "dpt":
          for (const dpt of fieldData) {
            // 跳过重复数据
            if (option.ignoreDuplicate && sumData.some((item) => item.value === dpt.value)) {
              continue;
            }
            sumData.push(dpt);
          }
          break;
      }
    }

    return sumData;
  }
}

/**
 * sum2Main option 参数类型定义
 * @typedef {Object} SumOption
 * @property {boolean} ignoreEmpty 是否跳过空数据，默认为true
 * @property {boolean} ignoreDuplicate 是否跳过重复数据，默认为true
 * @property {boolean} appendMode 追加模式，数据追加到主表字段上，而不是覆盖，默认为false
 * @property {Function} filter 一个数据过滤函数，接受子表行数据作为参数，返回falsy值跳过当前行
 * @property {string} separator 当数据类型为string时的分隔符，默认为半角逗号","
 * @property {number} decimalPlaces 当数据类型为number时，结果四舍五入到几位小数，默认不做舍入，可能存在浮点数精度问题
 */
/**
 * 子表字段汇总到主表
 * @static
 * @param {Object} context this上下文
 * @param {string} tableFieldId 子表唯一标识
 * @param {string} fieldInSubform 要汇总到主表的子表字段
 * @param {string} fieldInMainform 要汇总到的主表字段
 * @param {"string" | "number" | "dpt" | "employee"} dataType 字段数据类型，默认为string类型
 * @param {module:Subform~SumOption} option 扩展选项
 *
 * @example
 * export function onSubformChange() {
 *   // tableField_xyz子表中的 textField_123 字段将被汇总到主表 textField_abc 字段。
 *   sum2Main(this, "tableField_xyz", "textField_123", "textField_abc", "string", { appendMode: true });
 * }
 */
function sum2Main(context, tableFieldId, fieldInSubform, fieldInMainform, dataType, option) {
  dataType = dataType || "string";
  option = Object.assign(
    {
      ignoreEmpty: true,
      ignoreDuplicate: true,
      appendMode: false,
      filter: () => true,
      separator: ",",
    },
    option,
  );

  const subform = new Subform(context, tableFieldId);
  let sumData = subform.summary(fieldInSubform, dataType, {
    ignoreEmpty: option.ignoreEmpty,
    ignoreDuplicate: option.ignoreDuplicate,
    filter: option.filter,
  });

  // 追加模式
  if (option.appendMode) {
    const fieldData = context.$(fieldInMainform).getValue();
    switch (dataType) {
      case "string": {
        const existData = (fieldData || "").split(",");
        existData.forEach((str) => {
          // 跳过重复数据
          if (option.ignoreDuplicate && sumData.indexOf(str) !== -1) return;
          sumData.unshift(str);
        });
        break;
      }
      case "number": {
        let num = Number(fieldData);
        if (isNaN(num)) num = 0;
        sumData.unshift(num);
        break;
      }
      case "employee": {
        const existData = fieldData || [];
        existData.forEach((employee) => {
          const workId = employee.value || employee.key;
          if (!workId) return;
          // 跳过重复数据
          if (option.ignoreDuplicate && sumData.some((item) => (item.value || item.key) === workId))
            return;
          sumData.unshift(employee);
        });
        break;
      }
      case "dpt": {
        const existData = fieldData || [];
        existData.forEach((dpt) => {
          // 跳过重复数据
          if (option.ignoreDuplicate && sumData.some((item) => item.value === dpt.value)) return;
          sumData.unshift(dpt);
        });
        break;
      }
    }
  }

  if (dataType === "string") {
    sumData = sumData.join(option.separator);
  } else if (dataType === "number") {
    sumData = sumData.reduce((sum, current) => sum + current, 0);
    if (typeof option.decimalPlaces === "number") {
      sumData = round(sumData, option.decimalPlaces);
    }
  }
  context.$(fieldInMainform).setValue(sumData);
}

/**
 * FieldMap配置类型定义
 * @typedef {Object} FieldMapItem
 * @property {string} from 源字段
 * @property {string} to 填充字段
 * @property {"string" | "number" | "employee" | "dpt"} type 字段数据类型
 * @property {boolean} multiSelect 是否多选字段，type为employee时有用
 */
/**
 * AF2SubformOption 配置类型定义
 * @typedef {Object} AF2SubformOption
 * @property {string} keepOldData 是否保留非关联表单填充的旧数据，默认为true
 */
/**
 * 处理字段映射，组装并返回新的表单数据对象
 * @param {Object} formData 来源表单数据，如果来源为关联表单子表则为子表数据项目
 * @param {Array<module:Subform~FieldMapItem>} fieldMaps 字段映射定义
 * @param {Object} mainFormData 主表数据，如果来源是关联表单子表则该字段传主表数据，否则传null
 * @returns {Object} 新的表单数据对象
 */
function resolveFieldMaps(formData, fieldMaps, mainFormData, associateForm, formInstIdField) {
  const dataItem = {
    [formInstIdField]: associateForm.instanceId,
  };
  for (const fieldMap of fieldMaps) {
    const { from, to, type, multiSelect, handler } = fieldMap;

    const ids = formData[`${from}_id`];
    const values = formData[from];

    // 自定义映射方法
    if (handler && handler instanceof Function) {
      dataItem[to] = handler(formData, mainFormData, associateForm);
      continue;
    }

    switch (type) {
      case "employee": {
        const data = ids.map((id, index) => {
          const name = values[index];
          return {
            displayName: name,
            name: name,
            label: name,
            value: id,
            emplId: id,
            workId: id,
            workNo: id,
          };
        });

        if (multiSelect) {
          dataItem[to] = data;
        } else {
          dataItem[to] = data[0];
        }
        break;
      }
      case "dpt":
        dataItem[to] = ids.map((id, index) => ({
          value: id,
          name: values[index],
        }));
        break;
      default:
        dataItem[to] = formData[from];
        break;
    }
  }

  return dataItem;
}
/**
 * 将关联表单的数据填充到本表单的子表上
 * @static
 * @param {object} context this上下文
 * @param {"form" | "process"} formType 表单类型
 * @param {string} assocaiteFieldId 关联表单组件唯一标识
 * @param {string} localSubformId 本表单子表唯一标识
 * @param {string} formInstIdField 子表中用于存储关联表单实例Id的字段，用于判断子表数据应该删除还是新增
 * @param {module:Subform~FieldMapItem[]} fieldMaps 字段填充映射
 * @param {boolean} isDataFromSubform 填充数据是否来自关联表单的子表
 * @param {string} remoteSubformId 关联表单子表ID
 * @param {module:Subform~AF2SubformOption} options 扩展配置
 *
 * @example
 * export function onAssocciateFormChange() {
 *   // 将关联表单对应的表单值填充到本表单子表中
 *   associateForm2Subform(
 *     this,
 *     "form",
 *     "associationFormField_lrimaemr",
 *     "tableField_xxxxxx",
 *     "textField_xxxxxx",
 *     [{from: "textField_xxxxxx", to: "textField_xxxxxx", type: "string" }],
 *     false,
 *     { keepOldData: true }
 *   );
 * }
 */
async function associateForm2Subform(
  context,
  formType,
  assocaiteFieldId,
  localSubformId,
  formInstIdField,
  fieldMaps,
  isDataFromSubform,
  remoteSubformId,
  options,
) {
  formType = formType || "form";
  options = Object.assign({ keepOldData: true }, options);
  if (isDataFromSubform && !remoteSubformId) {
    throw new Error("remoteSubformId is reqired while isDataFromSubform is set to true");
  }

  const associateForm = context.$(assocaiteFieldId).getValue() || [];
  const localSubformDataList = context.$(localSubformId).getValue();

  // 1.找到需要从子表新增哪些关联表单数据
  const formShouldInsert = [];
  for (const form of associateForm) {
    const instId = form.instanceId;
    if (localSubformDataList.some((item) => item[formInstIdField] === instId)) {
      continue;
    }

    formShouldInsert.push(form);
  }
  console.log(
    `%c[关联表单填充子表]需要从${formShouldInsert.length}个关联表单新增数据`,
    "color: purple",
  );

  // 2.找到需要从子表删除哪些关联表单数据，并删除
  let newSubformDataList = [];
  let removedDataCount = 0;
  for (const subformDataItem of localSubformDataList) {
    const instId = subformDataItem[formInstIdField];
    // 子表中的表单实例Id字段为空或者和关联表单匹配的，认为是要保留的，其余删除
    if (options.keepOldData && !instId) {
      newSubformDataList.push(subformDataItem);
    } else if (associateForm.some((item) => item.instanceId === instId)) {
      newSubformDataList.push(subformDataItem);
    } else {
      removedDataCount += 1;
    }
  }
  console.log(`%c[关联表单填充子表]移除${removedDataCount}条子表数据`, "color: purple");

  // 3.获取关联表单数据，组装子表
  for (const form of formShouldInsert) {
    const formData = await getFormData(context, formType, form.instanceId);
    if (isDataFromSubform) {
      const subformDataList = formData[remoteSubformId] || [];
      for (const subformData of subformDataList) {
        const newDataItem = resolveFieldMaps(subformData, fieldMaps, null, form, formInstIdField);
        newSubformDataList.push(newDataItem);
      }
    } else {
      const newDataItem = resolveFieldMaps(formData, fieldMaps, null, form, formInstIdField);
      newSubformDataList.push(newDataItem);
    }
  }

  context.$(localSubformId).setValue(newSubformDataList);
  console.log(`%c[关联表单填充子表]新增了${newSubformDataList.length}条子表数据`, "color: purple");
}

export { Subform, sum2Main, associateForm2Subform };
