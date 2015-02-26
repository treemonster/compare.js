/*
自定义格式校验器
git: https://github.com/treemonster/checkFormat.js
用于批量处理json等复杂结构的js内容格式是否符合预计标准
*/

(function(){

  var is=function(a,b){
    return a!==undefined && a.constructor===b;
  };

  var tester={};

/*
checkNumber 把需要检测的值强制转换成数字，并且比较边界情况
"[123.001,200.12)" 大于等于123.001，小于200.12
"[123.001,200.12]" 大于等于123.001，小于等于200.12
"[123.001," 大于等于123.001
"(123.001," 大于123.001
",200.12]" 小于等于200.12
",200.12)" 小于200.12
"," 不比较边界情况，但是需要判断强制转换后不是NaN

如果最后带+，则会把强制转换后的值覆盖原始值:
"[123.001,200.12)+" 大于等于123.001，小于200.12，并且覆盖原始值

*/
  tester.checkNumber=function(needCheck,key,checkRegExp){
    var num=needCheck[key]*1;
    var number_test=/^(?:(?:([(\[])(-{0,1}\d*(?:\.\d|\d\.|\d)\d*)){0,1}),(?:(?:(-{0,1}\d*(?:\.\d|\d\.|\d)\d*)([)\]])){0,1})(\+{0,1})$/;
    return number_test.test(checkRegExp) && checkRegExp.replace(number_test,function(all,a,b,c,d,e){
      b*=1;c*=1;
      if(e)needCheck[key]=num;
      var meet= !isNaN(num);
      if(a!==undefined)
        if(a==='[')meet&=b<=num;
        else meet&=b<num;
      if(d!==undefined)
        if(d===']')meet&=c>=num;
        else meet&=c>num;
      if(meet)return 'TRUE';
    })==='TRUE';
  };

/*
checkSpecial 判断值是否为特殊值
'nan'           强制转换为数字，返回是否为NaN
'nan+'          强制转换为数字，并覆盖原始值，返回是否为NaN
'NaN'           返回是否为NaN
'undefined'     返回是否为undefined
'null'          返回是否为null
'[]'            返回是否为0长度数组
'{}'            返回是否为空对象
*/
  tester.checkSpecial=function(needCheck,key,checkRegExp){
    var nk=needCheck[key];
    switch(checkRegExp){
      case 'nan':return isNaN(nk*1);
      case 'nan+':return isNaN(needCheck[key]*=1);
      case 'NaN':return isNaN(nk);
      case 'undefined':return nk===undefined;
      case 'null':return nk===null;
      case '[]':return is(nk,Array) && !nk.length;
      case '{}':return is(nk,Object) && !Object.keys(nk).length;
    }
  };

  var checkFormat=function(needCheck,format){
    if(!is(format,Object) && !is(format,Array))return checkFormat(
      {check:needCheck},
      {check:format}
    );
    var check,checkData;
    for(var check in format){
      checkData=format[check];
      //如果format里的值为原型，则比较needCheck里值的原型是否一致
      switch(checkData){
      case String:case Array:case Object:
      case Function:case RegExp:case Number:
      case Date:case Blob:
        if(!is(needCheck[check],checkData))return false;
        continue;
      }
      switch(checkData.constructor){
      //如果format里的值为正则表达式，则把needCheck里值变成字符串之后，检测是否匹配
      case RegExp:
        if(!checkData.test(needCheck[check]+''))return false;
        break;
      //如果是字符串格式，则对应各种情况进行解析
      case String:
        var matched=false;
        for(var checker in tester)
          if(matched|=tester[checker](needCheck,check,checkData))break;
        if(!matched)return false;
        break;
      //如果是数组或对象，则每个元素分别处理
      case Array:case Object:
        if(!is(needCheck[check],checkData.constructor))return false;
        for(var i in checkData)
          if(!checkFormat(needCheck[check][i],checkData[i]))return false;
        break;
      case Function:
        if(!checkData(needCheck[check]))return false;
      default: return false;
      }
    }
    return true;
  };

  if(typeof(module)!=="undefined"){
    module.exports=checkFormat;
  }else if(typeof(window)!=="undefined"){
    window.checkFormat=checkFormat;
  }else throw new error('未知的运行环境');

})();
