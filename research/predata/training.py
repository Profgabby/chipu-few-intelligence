"""Dependency-free ridge regression benchmark for synthetic pipeline smoke tests."""
import math
from .statistics import metrics

def _solve(matrix, rhs):
    n=len(rhs)
    a=[list(row)+[rhs[i]] for i,row in enumerate(matrix)]
    for k in range(n):
        pivot=max(range(k,n),key=lambda i:abs(a[i][k]))
        a[k],a[pivot]=a[pivot],a[k]
        if abs(a[k][k])<1e-12: raise ValueError("Singular design matrix")
        div=a[k][k]
        a[k]=[v/div for v in a[k]]
        for i in range(n):
            if i!=k:
                factor=a[i][k]
                a[i]=[a[i][j]-factor*a[k][j] for j in range(n+1)]
    return [row[-1] for row in a]

def fit_ridge(features,targets,alpha=1.):
    x=[list(row) for row in features]; y=list(targets)
    if not x or len(x)!=len(y) or not x[0] or alpha<=0:
        raise ValueError("Nonempty matched data and positive regularization required")
    d=len(x[0])
    if any(len(row)!=d for row in x) or not all(math.isfinite(v) for row in x for v in row) or not all(math.isfinite(v) for v in y):
        raise ValueError("Invalid features or targets")
    design=[[1.]+row for row in x]
    gram=[[sum(row[i]*row[j] for row in design)+(alpha if i==j and i>0 else 0.)
           for j in range(d+1)] for i in range(d+1)]
    rhs=[sum(row[i]*target for row,target in zip(design,y)) for i in range(d+1)]
    return _solve(gram,rhs)

def predict(weights,features):
    return [sum(w*v for w,v in zip(weights,[1.]+list(row))) for row in features]

def chronological_benchmark(records,train_fraction=0.7):
    """Records: ordered (timestamp, features, target). Strictly forward holdout."""
    ordered=sorted(records,key=lambda row:row[0])
    if len(ordered)<6 or not (0.5<=train_fraction<=0.9):
        raise ValueError("Need >=6 records and sensible split")
    n=int(len(ordered)*train_fraction)
    if ordered[n-1][0]>=ordered[n][0]:
        raise ValueError("Temporal split boundary overlaps; potential leakage")
    weights=fit_ridge([r[1] for r in ordered[:n]],[r[2] for r in ordered[:n]])
    observed=[r[2] for r in ordered[n:]]
    predicted=predict(weights,[r[1] for r in ordered[n:]])
    return {"weights":weights,"train_n":n,"test_n":len(observed),
            "holdout_metrics":metrics(observed,predicted),
            "validation_status":"SYNTHETIC_OR_UNVERIFIED_DATA_ONLY"}
