# PY-3639

def f(x):
    from <warning descr="Unresolved reference 'foo'">foo</warning> import <warning descr="Unresolved reference 'StringIO'">StringIO</warning>
    return StringIO(x)

def f(x):
    try:
        from <warning descr="Unresolved reference 'foo'">foo</warning> import <warning descr="Module 'StringIO' not found">StringIO</warning>
    except Exception:
        pass
    return x

def f(x):
    try:
        from foo import <warning descr="'StringIO' in try block with 'except ImportError' should also be defined in except block">StringIO</warning>
    except ImportError:
        pass
    return StringIO(x)

def f(x):
    try:
        from lib1 import StringIO
    except ImportError:
        StringIO = lambda x: x
    return StringIO(x)
