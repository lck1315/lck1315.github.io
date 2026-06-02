with open('/Users/cg/Documents/lck1315.github.io/work.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '<div id="tab-performance" class="tab-content">' in line:
        start_idx = i
    if start_idx != -1 and '<!-- 탭 내용: 프로젝트' in line:
        # Go back to find the closing div of tab-performance and container
        # Actually, lines[start_idx] to lines[i-1] should be replaced
        end_idx = i - 1
        break

new_content = """                <!-- 탭 내용: 개인성과 (팀원 평가 매트릭스) -->
                <div id="tab-performance" class="tab-content">
                    <div id="performance-content-container" style="max-width: 1200px; margin: 0 auto; height: 100%; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="font-size: 1.5rem; font-weight: bold; color: var(--text-color); margin: 0;">
                                <i class="fa-solid fa-users-viewfinder" style="color: var(--primary-color); margin-right: 8px;"></i> 팀원 평가 매트릭스
                            </h2>
                            <div style="display: flex; gap: 10px;">
                                <button id="btn-perf-add-row" class="btn btn-secondary" style="font-size: 0.85rem;"><i class="fa-solid fa-layer-group"></i> 항목 추가</button>
                                <button id="btn-perf-add-col" class="btn btn-secondary" style="font-size: 0.85rem;"><i class="fa-solid fa-user-plus"></i> 팀원 추가</button>
                            </div>
                        </div>
                        
                        <!-- 엑셀형 테이블 컨테이너 -->
                        <div class="glass-card" style="flex: 1; overflow: auto; border-radius: 12px; border: 1px solid var(--card-border); background: #fff; padding: 0;">
                            <table id="perf-matrix-table" style="width: 100%; border-collapse: collapse; min-width: 800px;">
                                <thead>
                                    <tr id="perf-matrix-header" style="background: #f8f9fa;">
                                        <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; position: sticky; top: 0; left: 0; background: #f8f9fa; z-index: 2; min-width: 200px; font-weight: bold; color: #495057;">평가 항목</th>
                                    </tr>
                                </thead>
                                <tbody id="perf-matrix-body">
                                </tbody>
                            </table>
                            <div id="perf-matrix-empty" style="text-align: center; padding: 50px; color: #888; display: none;">
                                상단의 버튼을 눌러 평가 항목과 팀원을 추가해보세요!
                            </div>
                        </div>
                    </div>
                </div>

"""

if start_idx != -1 and end_idx != -1:
    # Need to go back to not overwrite the closing tag of container if it's there
    lines[start_idx-1:end_idx] = [new_content]
    with open('/Users/cg/Documents/lck1315.github.io/work.html', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"Replaced lines {start_idx} to {end_idx}")
else:
    print("Could not find the target block.")
