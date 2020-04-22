let mvvm = new Mvvm({
    el: '#app',
    data: {     
        text: '这是一个小demo',
        obj: {
            name: '郭德纲'
        },
    }
});
//Watcher构造函数
function Watcher(vm, exp, fn) {
    this.fn = fn;
    this.vm = vm;
    this.exp = exp;
    Dep.target = this;
    let arr = exp.split('.');
    let val = vm;
    arr.forEach(key => {
        val = val[key]
    })
    Dep.target = null;
}
Watcher.prototype.update = function () {
    // notify的时候值已经更改了
    // 再通过vm, exp来获取新的值
    let arr = this.exp.split('.');
    let val = this.vm;
    arr.forEach(key => {
        val = val[key];   // 通过get获取到新的值
    });
    this.fn(val);   // 将每次拿到的新值去替换{{}}的内容即可
};

//发布订阅 把要执行的函数统一存储在一个数组中管理，当达到某个执行条件时，循环这个数组并执行每一个成员。
function Dep() {
    // 一个数组(存放函数的事件池)
    this.subs = [];

}
Dep.prototype.addSub = function (sub) {
    this.subs.push(sub);
};
Dep.prototype.notify = function () {
    this.subs.forEach(sub => sub.update());
};

function Mvvm(options = {}) {
    this.$options = options
    let data = this._data = this.$options.data

    //数据劫持 Object.defineProperty
    observe(data)

    //数据代理 方便拿data里面的数据
    for (let key in data) {
        Object.defineProperty(this, key, {
            configurable: true,
            get() {
                return this._data[key];     // 如this.a = {b: 1}
            },
            set(newVal) {
                this._data[key] = newVal;
            }
        });
    }


    //数据编译
    new Compile(options.el, this)


}
function Compile(el, vm) {
    vm.$el = document.querySelector(el)

    let fragment = document.createDocumentFragment();

    while (child = vm.$el.firstChild) {
        fragment.appendChild(child)
    }

    replace(fragment)

    vm.$el.appendChild(fragment)

    function replace(frag) {
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent
            let reg = /\{\{(.*?)\}\}/g
            if (node.nodeType === 3 && reg.test(txt)) {
                let arr = RegExp.$1.split('.')
                let val = vm
                arr.forEach(key => {
                    val = val[key]
                })
                node.textContent = txt.replace(reg, val).trim()
                new Watcher(vm, RegExp.$1, newVal => {
                    node.textContent = txt.replace(reg, newVal).trim()
                })
            }
            if (node.childNodes && node.childNodes.length) {
                replace(node)
            }
        })
    }
}


function Observe(data) {
    let dep = new Dep();
    for (let key in data) {
        let val = data[key]
        observe(val)
        Object.defineProperty(data, key, {
            get() {
                Dep.target && dep.addSub(Dep.target);   // 将watcher添加到订阅事件中 [watcher]
                return val;
            },
            set(newVal) {
                if (val === newVal) {
                    return;
                }
                val = newVal;
                observe(newVal);
                dep.notify();   // 让所有watcher的update方法执行即可
            }
        })
    }
}


function observe(data) {
    if (!data || typeof data !== 'object') {
        return
    }
    return new Observe(data)
}
