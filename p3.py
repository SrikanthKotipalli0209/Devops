import sys

a = [1, 2, 3, 4, 5]
b = (1, 2, 3, 4, 5)

print(f"List size: {sys.getsizeof(a)} bytes")
print(f"Tuple size: {sys.getsizeof(b)} bytes")

"""
List size: 52 bytes
Tuple size: 40 bytes
"""
